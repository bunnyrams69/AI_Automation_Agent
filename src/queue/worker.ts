import { logger } from '../config/logger.js';
import { downloadAndTranscribeAudio } from '../agent/transcribe.js';
import { agentOrchestrator } from '../agent/orchestrator.js';
import { sendVoiceReplyIfEnabled } from '../agent/tts.js';
import { conversationsRepo } from '../db/repositories/conversations.repo.js';
import { inboundEventsRepo } from '../db/repositories/events.repo.js';
import { followUpsRepo } from '../db/repositories/follow-ups.repo.js';
import { leadsRepo } from '../db/repositories/leads.repo.js';
import { messagesRepo } from '../db/repositories/messages.repo.js';
import { auditRepo } from '../db/repositories/audit.repo.js';
import { InboundEvent, Lead } from '../db/types.js';
import { whatsAppClient } from '../whatsapp/client.js';
import { formatWhatsAppMessage } from '../whatsapp/format.js';
import { isOptOutMessage } from '../whatsapp/parser.js';

export class QueueWorker {
  private isRunning = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private readonly pollIntervalMs = 1000;
  private readonly debounceWaitMs = 3000; // 3-second debounce window

  // Locks to enforce strictly sequential processing per lead
  private activeLeads = new Set<string>();

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info('Inbound event queue worker started');
    this.poll();
  }

  stop(): void {
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    logger.info('Inbound event queue worker stopped');
  }

  private async poll(): Promise<void> {
    if (!this.isRunning) return;

    try {
      // Claim up to 5 pending events atomically
      const events = await inboundEventsRepo.claimBatch(5);

      for (const event of events) {
        if (!this.isRunning) break;

        // Skip if another turn is actively running for this lead
        if (this.activeLeads.has(event.lead_wa_id)) {
          continue;
        }

        // Process asynchronously without blocking the loop
        this.processEventWithLock(event).catch((err) => {
          logger.error({ err, eventId: event.id }, 'Unhandled error in queue worker process loop');
        });
      }
    } catch (err) {
      logger.error({ err }, 'Error polling inbound events queue');
    } finally {
      if (this.isRunning) {
        this.pollTimer = setTimeout(() => this.poll(), this.pollIntervalMs);
      }
    }
  }

  private async processEventWithLock(event: InboundEvent): Promise<void> {
    const leadWaId = event.lead_wa_id;
    this.activeLeads.add(leadWaId);

    try {
      await this.processEvent(event);
    } finally {
      this.activeLeads.delete(leadWaId);
    }
  }

  private async processEvent(event: InboundEvent): Promise<void> {
    const payload = event.payload as Record<string, any>;
    const waMessageId = event.wa_message_id;
    const phone = payload.phone_e164 || `+${event.lead_wa_id}`;
    const senderName = payload.sender_name || null;
    const source = payload.referral ? 'ad' : 'organic';

    logger.info({ eventId: event.id, leadWaId: event.lead_wa_id }, 'Processing inbound message event');

    // 1. Identify or create the lead record
    const lead = await leadsRepo.upsertLead({
      wa_id: event.lead_wa_id,
      phone,
      name: senderName,
      source,
      ad_reference: payload.referral || null,
    });

    // 2. Retrieve or create the conversation record
    const conversation = await conversationsRepo.getOrCreateForLead(lead.id);
    await conversationsRepo.touchLastMessage(conversation.id);

    // 3. Database-level timestamp debounce: events are only claimed by the database procedure
    // after at least 3 seconds have passed since the latest message for this lead.
    // Query all bundled pending events that arrived for this lead to process in a single unified turn.
    const bundledEvents = await inboundEventsRepo.getPendingForLead(event.lead_wa_id, event.id);

    // 4. Handle initial message media & transcription
    let inboundText = payload.body || '';
    let isAudioInbound = payload.type === 'audio';

    if (isAudioInbound && payload.media_id) {
      const transcription = await downloadAndTranscribeAudio(
        payload.media_id,
        lead.wa_id,
        waMessageId,
        payload.mime_type
      );

      // Record message in DB
      await messagesRepo.create({
        conversation_id: conversation.id,
        lead_id: lead.id,
        wa_message_id: waMessageId,
        direction: 'in',
        type: 'audio',
        body: null,
        transcript: transcription.transcript,
        media_id: payload.media_id,
        media_storage_path: transcription.storagePath,
        raw_payload: payload,
      });

      if (!transcription.success || !transcription.transcript) {
        // Polite prompt asking user to repeat or type
        const repeatMsg =
          'Sorry, I could not hear your voice note clearly. Could you please repeat or type your message? 🙏';
        await whatsAppClient.sendText(lead.phone, repeatMsg);
        await messagesRepo.create({
          conversation_id: conversation.id,
          lead_id: lead.id,
          direction: 'out',
          type: 'text',
          body: repeatMsg,
        });
        await inboundEventsRepo.markDone(event.id);
        return;
      }

      inboundText = transcription.transcript;
    } else {
      // Record regular text/image/interactive message in DB
      await messagesRepo.create({
        conversation_id: conversation.id,
        lead_id: lead.id,
        wa_message_id: waMessageId,
        direction: 'in',
        type: payload.type || 'text',
        body: inboundText,
        media_id: payload.media_id || null,
        raw_payload: payload,
      });
    }

    // 5. Append any debounced follow-up messages into a single combined prompt turn
    if (bundledEvents.length > 0) {
      logger.info(
        { count: bundledEvents.length, leadWaId: event.lead_wa_id },
        'Bundling debounced messages into single agent turn'
      );

      for (const bEvent of bundledEvents) {
        const bPayload = bEvent.payload as Record<string, any>;
        const bText = bPayload.body || '';

        await messagesRepo.create({
          conversation_id: conversation.id,
          lead_id: lead.id,
          wa_message_id: bEvent.wa_message_id,
          direction: 'in',
          type: bPayload.type || 'text',
          body: bText,
          raw_payload: bPayload,
        });

        if (bText) {
          inboundText += `\n${bText}`;
        }
        await inboundEventsRepo.markDone(bEvent.id);
      }
    }

    // 6. Check for Opt-Out (STOP / unsubscribe in English, Hindi, Telugu)
    if (isOptOutMessage(inboundText)) {
      logger.info({ leadId: lead.id }, 'Lead requested opt-out / STOP');
      await leadsRepo.setOptedOut(lead.id);
      await followUpsRepo.cancelPendingForLead(lead.id);

      const optOutReply = 'You have been unsubscribed and will not receive any further messages. Thank you.';
      await whatsAppClient.sendText(lead.phone, optOutReply);
      await messagesRepo.create({
        conversation_id: conversation.id,
        lead_id: lead.id,
        direction: 'out',
        type: 'text',
        body: optOutReply,
      });

      await auditRepo.log('lead_opt_out', lead.id, 'unsubscribed', 'system');
      await inboundEventsRepo.markDone(event.id);
      return;
    }

    // 7. Check if conversation is currently in HUMAN takeover mode
    if (conversation.mode === 'human') {
      logger.info({ leadId: lead.id }, 'Conversation is in human mode; suppressing AI auto-reply');
      await auditRepo.log('human_mode', conversation.id, 'inbound_message_logged_for_human', 'system', {
        text_preview: inboundText.slice(0, 50),
      });
      await inboundEventsRepo.markDone(event.id);
      return;
    }

    // 8. Execute Agent Orchestrator
    try {
      const result = await agentOrchestrator.processLeadTurn(lead, conversation, inboundText);

      const formattedReply = formatWhatsAppMessage(result.replyText);

      // Send WhatsApp outbound text response only if non-empty
      if (formattedReply && formattedReply.trim().length > 0) {
        const outMsgId = await whatsAppClient.sendText(lead.phone, formattedReply);

        // Store outbound message in DB
        await messagesRepo.create({
          conversation_id: conversation.id,
          lead_id: lead.id,
          wa_message_id: outMsgId,
          direction: 'out',
          type: 'text',
          body: formattedReply,
          delivery_status: 'sent',
        });

        // Update lead last outbound timestamp
        await leadsRepo.recordOutbound(lead.id);

        // Send optional voice note reply if enabled and inbound was audio
        if (isAudioInbound) {
          await sendVoiceReplyIfEnabled(lead.phone, formattedReply, true);
        }
      }

      // Mark inbound event complete
      await inboundEventsRepo.markDone(event.id);
    } catch (err: any) {
      logger.error({ err, eventId: event.id }, 'Failed to execute agent orchestrator turn');

      const attempts = (event.attempts || 0) + 1;
      if (attempts >= 3) {
        await inboundEventsRepo.markFailed(event.id, err.message || 'Exceeded 3 attempts');
      } else {
        // Re-throw to allow retry on next cycle
        throw err;
      }
    }
  }
}

export const queueWorker = new QueueWorker();
