import cron from 'node-cron';
import { logger } from '../config/logger.js';
import { followUpsRepo } from '../db/repositories/follow-ups.repo.js';
import { leadsRepo } from '../db/repositories/leads.repo.js';
import { messagesRepo } from '../db/repositories/messages.repo.js';
import { conversationsRepo } from '../db/repositories/conversations.repo.js';
import { FollowUp, Lead } from '../db/types.js';
import { whatsAppClient } from '../whatsapp/client.js';
import { isWithin24HourWindow } from '../whatsapp/parser.js';

export class FollowUpScheduler {
  private cronJob: cron.ScheduledTask | null = null;
  private isProcessing = false;

  start(): void {
    if (this.cronJob) return;

    logger.info('Starting follow-up & reminder scheduler (cron: every 60s)');
    // Run every minute
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.processDueFollowUps();
    });
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Follow-up scheduler stopped');
    }
  }

  async processDueFollowUps(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const dueFollowUps = await followUpsRepo.getDue(10);
      if (dueFollowUps.length === 0) return;

      logger.info({ count: dueFollowUps.length }, 'Processing due follow-ups and reminders');

      for (const followUp of dueFollowUps) {
        await this.handleSingleFollowUp(followUp);
      }
    } catch (err) {
      logger.error({ err }, 'Error in follow-up scheduler processing loop');
    } finally {
      this.isProcessing = false;
    }
  }

  private async handleSingleFollowUp(followUp: FollowUp): Promise<void> {
    try {
      const lead = await leadsRepo.getById(followUp.lead_id);
      if (!lead) {
        await followUpsRepo.markFailed(followUp.id, 'Lead not found');
        return;
      }

      // 1. Guard checks: Never message opted-out or lost leads
      if (lead.status === 'opted_out' || lead.status === 'lost') {
        logger.info({ followUpId: followUp.id, leadId: lead.id }, 'Cancelling follow-up for opted-out/lost lead');
        await followUpsRepo.cancelPendingForLead(lead.id);
        return;
      }

      // If lead already booked, cancel sales nurtures
      if (lead.status === 'booked' && (followUp.kind === 'warm_nurture' || followUp.kind === 'cold_nurture' || followUp.kind === 'no_reply')) {
        logger.info({ followUpId: followUp.id, leadId: lead.id }, 'Cancelling nurture follow-up for booked lead');
        await followUpsRepo.cancelPendingForLead(lead.id, ['warm_nurture', 'cold_nurture', 'no_reply']);
        return;
      }

      // 2. Frequency limits:
      // Warm nurture: max 2 attempts
      if (followUp.kind === 'warm_nurture') {
        const sentWarm = await followUpsRepo.countSentByKind(lead.id, 'warm_nurture');
        if (sentWarm >= 2) {
          await followUpsRepo.cancelPendingForLead(lead.id, ['warm_nurture']);
          return;
        }
      }
      // Cold nurture: max 1 attempt
      if (followUp.kind === 'cold_nurture') {
        const sentCold = await followUpsRepo.countSentByKind(lead.id, 'cold_nurture');
        if (sentCold >= 1) {
          await followUpsRepo.cancelPendingForLead(lead.id, ['cold_nurture']);
          return;
        }
      }
      // No reply: max 2 attempts
      if (followUp.kind === 'no_reply') {
        const sentNoReply = await followUpsRepo.countSentByKind(lead.id, 'no_reply');
        if (sentNoReply >= 2) {
          await followUpsRepo.cancelPendingForLead(lead.id, ['no_reply']);
          return;
        }
      }

      // 3. 24-Hour WhatsApp Messaging Window Check
      const in24hWindow = isWithin24HourWindow(lead.last_inbound_at);
      const conversation = await conversationsRepo.getOrCreateForLead(lead.id);

      let outboundMessageId = '';
      const leadName = lead.name ? ` ${lead.name}` : '';

      if (in24hWindow) {
        // Free-form message allowed within 24h of lead's inbound message
        const text = this.buildFreeFormFollowUpText(followUp, leadName);
        outboundMessageId = await whatsAppClient.sendText(lead.phone, text);

        await messagesRepo.create({
          conversation_id: conversation.id,
          lead_id: lead.id,
          wa_message_id: outboundMessageId,
          direction: 'out',
          type: 'text',
          body: text,
        });
      } else {
        // Outside 24h window: MUST use pre-approved Meta Template message
        const templateName = followUp.template_name || this.getDefaultTemplateName(followUp.kind);
        logger.info(
          { leadId: lead.id, templateName },
          'Lead is outside 24h customer window; dispatching pre-approved template message'
        );

        outboundMessageId = await whatsAppClient.sendTemplate(lead.phone, templateName, 'en');

        await messagesRepo.create({
          conversation_id: conversation.id,
          lead_id: lead.id,
          wa_message_id: outboundMessageId,
          direction: 'out',
          type: 'template',
          body: `[Template: ${templateName}]`,
        });
      }

      await leadsRepo.recordOutbound(lead.id);
      await followUpsRepo.markSent(followUp.id);
      logger.info({ followUpId: followUp.id, leadId: lead.id }, 'Follow-up message dispatched successfully');
    } catch (err: any) {
      logger.error({ err, followUpId: followUp.id }, 'Failed to dispatch follow-up message');
      await followUpsRepo.markFailed(followUp.id, err.message || 'Dispatch failed');
    }
  }

  private buildFreeFormFollowUpText(followUp: FollowUp, leadName: string): string {
    const payload = followUp.payload || {};
    const siteName = (payload.site_name as string) || 'our development';

    switch (followUp.kind) {
      case 'visit_reminder':
        return `Hello${leadName}! 🌿 This is a friendly reminder regarding your scheduled site visit to *${siteName}*. Please let us know if you need to reschedule or have any questions!`;

      case 'warm_nurture':
        return `Hi${leadName}! Following up on your inquiry about our properties. Would you like to preview our site layout plans or explore availability slots for this upcoming weekend? 🤝`;

      case 'cold_nurture':
        return `Hello${leadName}! Sharing our latest project construction highlights and price updates. Feel free to message back anytime if your timeline or preferences have updated.`;

      case 'no_reply':
      default:
        return `Hi${leadName}! Just checking if you had any further questions regarding plot sizes, villa pricing, or bank loan assistance? Happy to assist!`;
    }
  }

  private getDefaultTemplateName(kind: FollowUp['kind']): string {
    switch (kind) {
      case 'visit_reminder':
        return 'site_visit_reminder';
      case 'warm_nurture':
        return 'warm_lead_nurture';
      case 'cold_nurture':
        return 'cold_lead_nurture';
      case 'no_reply':
      default:
        return 'general_lead_followup';
    }
  }
}

export const followUpScheduler = new FollowUpScheduler();
