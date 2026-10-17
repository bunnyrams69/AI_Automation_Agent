import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { auditRepo } from '../db/repositories/audit.repo.js';
import { businessRepo } from '../db/repositories/business.repo.js';
import { conversationsRepo } from '../db/repositories/conversations.repo.js';
import { messagesRepo } from '../db/repositories/messages.repo.js';
import { sitesRepo } from '../db/repositories/sites.repo.js';
import { Conversation, Lead, Message } from '../db/types.js';
import { buildSystemPrompt } from './prompts.js';
import { agentToolDeclarations } from './tools/definitions.js';
import { toolExecutor } from './tools/executor.js';

export interface AgentRunResult {
  replyText: string;
  toolCallsExecuted: number;
  handoffTriggered: boolean;
}

export class AgentOrchestrator {
  private readonly maxToolIterations = 5;

  /**
   * Run one full conversational turn of the Gemini sales agent
   */
  async processLeadTurn(
    lead: Lead,
    conversation: Conversation,
    incomingMessageText: string
  ): Promise<AgentRunResult> {
    const turnStartTime = Date.now();
    const correlationId = `turn-${lead.id}-${turnStartTime}`;
    logger.info({ correlationId, leadId: lead.id }, 'Beginning AI agent processing turn');

    const TURN_TIMEOUT_MS = 45000;
    let timeoutHandle: NodeJS.Timeout | null = null;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(`Turn timed out after ${TURN_TIMEOUT_MS}ms`));
      }, TURN_TIMEOUT_MS);
    });

    try {
      return await Promise.race([
        this.runTurnLogic(lead, conversation, incomingMessageText, turnStartTime, correlationId),
        timeoutPromise,
      ]);
    } catch (err: any) {
      const turnLatencyMs = Date.now() - turnStartTime;
      logger.error({ err, leadId: lead.id, latencyMs: turnLatencyMs }, 'Turn failed or timed out');

      const canSend = conversationsRepo.canSendFallback(conversation);
      await conversationsRepo.recordFallback(conversation.id);

      const fallbackText = canSend
        ? 'Sorry, I hit a small technical issue. Could you send that again in a minute?'
        : '';

      await auditRepo.log('gemini_error', lead.id, 'turn_fallback_triggered', 'system', {
        error: err.message,
        canSendFallback: canSend,
        latencyMs: turnLatencyMs,
      });

      return {
        replyText: fallbackText,
        toolCallsExecuted: 0,
        handoffTriggered: false,
      };
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private async runTurnLogic(
    lead: Lead,
    conversation: Conversation,
    incomingMessageText: string,
    turnStartTime: number,
    correlationId: string
  ): Promise<AgentRunResult> {
    // 1. Fetch business profile and available sites
    const [business, sites] = await Promise.all([
      businessRepo.getProfile(),
      sitesRepo.listAvailable(),
    ]);
    const systemInstruction = buildSystemPrompt(business, sites);

    // 2. Fetch recent conversation history (last 20 messages)
    const recentMessages = await messagesRepo.getRecentByLeadId(lead.id, 20);

    // 3. Construct contents array for Gemini
    const contents: any[] = [];

    // Inject lead summary context if available
    const leadContextNote = `[Context Note: Customer Name: "${lead.name || 'Not provided'}", Phone: "${lead.phone}", Current Score: "${lead.score}", Budget: "${lead.budget || 'Not specified'}", Timeline: "${lead.timeline || 'Not specified'}", Preferred Location: "${lead.preferred_location || 'Not specified'}", Summary: "${lead.summary || 'None'}"]`;

    // Map conversation history with alternating turns and omitting transient fallbacks
    for (const msg of recentMessages) {
      const textContent = msg.transcript || msg.body;
      if (!textContent) continue;
      if (textContent.includes('Sorry, I hit a small technical issue')) continue;

      const role = msg.direction === 'in' ? 'user' : 'model';
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n${textContent}`;
      } else {
        contents.push({
          role,
          parts: [{ text: textContent }],
        });
      }
    }

    // Append current incoming turn cleanly
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts[0].text += `\n\n${leadContextNote}`;
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: `${incomingMessageText}\n\n${leadContextNote}` }],
      });
    }

    // 4. Initialize Gemini client
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    let iterations = 0;
    let toolCallsCount = 0;
    let finalReply = '';

    while (iterations < this.maxToolIterations) {
      iterations++;
      let response: any;

      try {
        response = await this.callGeminiWithRetry(ai, systemInstruction, contents);
      } catch (err: any) {
        logger.error({ err, leadId: lead.id }, 'Gemini API call failed after retries');

        const canSend = conversationsRepo.canSendFallback(conversation);
        await conversationsRepo.recordFallback(conversation.id);

        finalReply = canSend
          ? 'Sorry, I hit a small technical issue. Could you send that again in a minute?'
          : '';

        await auditRepo.log('gemini_rate_limit', lead.id, 'fallback_triggered', 'system', {
          error: err.message,
          canSendFallback: canSend,
        });

        return {
          replyText: finalReply,
          toolCallsExecuted: toolCallsCount,
          handoffTriggered: false,
        };
      }

      // Check if model called functions
      const functionCalls = response.functionCalls;

      if (!functionCalls || functionCalls.length === 0) {
        // No function calls; extract model's final message
        finalReply = response.text ? response.text.trim() : '';
        break;
      }

      // Push the model's actual turn with all its parts (preserving thought_signature)
      if (response.candidates?.[0]?.content) {
        contents.push(response.candidates[0].content);
      } else {
        contents.push({
          role: 'model',
          parts: functionCalls.map((fc: any) => ({ functionCall: fc })),
        });
      }

      // Execute each function call with error resilience so a tool error never aborts a turn
      const functionResponseParts: any[] = [];
      for (const call of functionCalls) {
        toolCallsCount++;
        const toolName = call.name;
        const toolArgs = call.args || {};

        logger.info({ tool: toolName, args: toolArgs }, 'Agent requested tool call');

        let toolResult: any;
        try {
          toolResult = await toolExecutor.executeTool(toolName, toolArgs, {
            lead,
            conversation,
          });
        } catch (toolErr: any) {
          logger.error({ tool: toolName, err: toolErr }, 'Tool execution threw an exception; returning error to Gemini');
          toolResult = { error: toolErr?.message || 'Tool execution failed' };
        }

        functionResponseParts.push({
          functionResponse: {
            name: toolName,
            response: toolResult,
          },
        });
      }

      // Append all tool responses in a single user turn
      contents.push({
        role: 'user',
        parts: functionResponseParts,
      });
    }

    // If final reply is still empty after loop, supply friendly fallback
    if (!finalReply) {
      finalReply = 'Please let me know how I can best assist with your property search today!';
    }

    const handoffTriggered = conversation.mode === 'human';
    const turnLatencyMs = Date.now() - turnStartTime;

    logger.info(
      { leadId: lead.id, toolCallsExecuted: toolCallsCount, handoffTriggered, latencyMs: turnLatencyMs },
      'Agent turn completed successfully'
    );

    return {
      replyText: finalReply,
      toolCallsExecuted: toolCallsCount,
      handoffTriggered,
    };
  }

  /**
   * Helper with exponential backoff for Gemini free-tier rate limits (429/5xx)
   */
  private async callGeminiWithRetry(
    ai: GoogleGenAI,
    systemInstruction: string,
    contents: any[],
    maxRetries = 2,
    initialDelayMs = 1500
  ): Promise<any> {
    const candidateModels = [
      env.GEMINI_MODEL,
      'gemini-flash-latest',
      'gemini-3.5-flash',
    ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

    let lastError: any;

    for (const modelToUse of candidateModels) {
      let attempt = 0;
      let delay = initialDelayMs;

      while (attempt <= maxRetries) {
        attempt++;
        try {
          const response = await ai.models.generateContent({
            model: modelToUse,
            contents,
            config: {
              systemInstruction,
              temperature: 0.2, // Low temperature for high factual consistency
              tools: [
                {
                  functionDeclarations: agentToolDeclarations,
                },
              ],
            },
          });
          return response;
        } catch (err: any) {
          lastError = err;
          const isQuotaExhausted =
            err?.message?.includes('RESOURCE_EXHAUSTED') ||
            err?.message?.includes('Quota exceeded');

          if (isQuotaExhausted) {
            logger.warn(
              { model: modelToUse, error: err.message },
              `Gemini quota exhausted for ${modelToUse}. Switching to fallback model...`
            );
            break; // Try next candidate model immediately
          }

          const isTransient =
            err?.status === 429 ||
            err?.status >= 500 ||
            err?.message?.includes('429') ||
            err?.message?.includes('503') ||
            err?.message?.includes('Service Unavailable');

          if (isTransient && attempt <= maxRetries) {
            logger.warn(
              { model: modelToUse, attempt, delayMs: delay, error: err.message },
              'Gemini transient rate-limit or 5xx. Retrying with exponential backoff...'
            );
            await new Promise((res) => setTimeout(res, delay));
            delay *= 2;
            continue;
          }

          break; // Non-transient error, try next candidate model
        }
      }
    }

    throw lastError || new Error('Max retries exceeded calling Gemini across candidate models');
  }
}

export const agentOrchestrator = new AgentOrchestrator();
