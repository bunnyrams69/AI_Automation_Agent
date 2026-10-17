import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { getSupabase } from '../db/client.js';
import { EmailOutboxItem, Lead, Site, SiteVisit } from '../db/types.js';
import { escapeHtml } from './escape.js';

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
  relatedLeadId?: string | null;
  relatedVisitId?: string | null;
}

export class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter(): void {
    if (env.EMAIL_PROVIDER === 'smtp') {
      if (!env.SMTP_USER || !env.SMTP_PASS) {
        logger.info('SMTP credentials not fully configured; email service operating in dry-run/mock mode');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }
  }

  /**
   * Enqueue email into email_outbox table. Never throws or delays caller.
   */
  async enqueue(payload: EmailPayload): Promise<string | null> {
    const supabase = getSupabase();
    try {
      const { data, error } = await supabase
        .from('email_outbox')
        .insert({
          to_address: payload.to,
          subject: payload.subject,
          text_body: payload.text,
          html_body: payload.html,
          status: 'pending',
          attempts: 0,
          related_lead_id: payload.relatedLeadId || null,
          related_visit_id: payload.relatedVisitId || null,
        })
        .select('id')
        .single();

      if (error) {
        logger.warn({ error: error.message }, 'Failed to insert into email_outbox table; attempting direct send');
        // If DB table not ready, try direct send without blocking
        this.sendDirect(payload).catch((sendErr) => {
          logger.warn({ sendErr }, 'Direct email send also failed');
        });
        return null;
      }

      // Trigger background processing asynchronously
      setImmediate(() => {
        this.processPendingOutbox().catch((err) => {
          logger.debug({ err }, 'Background outbox dispatch error');
        });
      });

      return data?.id || null;
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Failed to enqueue email outbox item');
      return null;
    }
  }

  /**
   * Low-level send dispatcher based on provider
   */
  async sendDirect(payload: EmailPayload): Promise<boolean> {
    if (env.EMAIL_PROVIDER === 'mock' || env.NODE_ENV === 'test') {
      logger.info({ to: payload.to, subject: payload.subject }, '[Mock Email] Dispatched email successfully');
      return true;
    }

    if (env.EMAIL_PROVIDER === 'resend' && env.RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to: payload.to,
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Resend email API failed: ${res.status} ${errBody}`);
      }
      return true;
    }

    // Default: SMTP
    if (!this.transporter) {
      logger.warn('No active SMTP transporter configured; email skipped');
      return true;
    }

    await this.transporter.sendMail({
      from: env.EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });

    return true;
  }

  /**
   * Worker to process pending outbox rows with retries and exponential backoff
   */
  async processPendingOutbox(limit = 10): Promise<number> {
    const supabase = getSupabase();
    const { data: items, error } = await supabase
      .from('email_outbox')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 5)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error || !items || items.length === 0) {
      return 0;
    }

    let processed = 0;
    for (const item of items) {
      const attempts = (item.attempts || 0) + 1;
      try {
        await this.sendDirect({
          to: item.to_address,
          subject: item.subject,
          text: item.text_body,
          html: item.html_body,
        });

        await supabase
          .from('email_outbox')
          .update({
            status: 'sent',
            attempts,
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        processed++;
      } catch (err: any) {
        logger.error({ err, outboxId: item.id, attempts }, 'Failed to dispatch outbox email');

        await supabase
          .from('email_outbox')
          .update({
            status: attempts >= 5 ? 'failed' : 'pending',
            attempts,
            last_error: err?.message || 'Send failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);
      }
    }

    return processed;
  }

  // =========================================================================
  // HIGH-LEVEL NOTIFICATION HELPERS
  // =========================================================================

  /**
   * (a) Site Visit Confirmed Summary -> internal notification to NOTIFY_EMAIL + copy to lead
   */
  async notifySiteVisitConfirmed(params: {
    lead: Lead;
    site: Site | null;
    scheduledAtStr: string;
    calBookingUid?: string | null;
    rescheduleUrl?: string | null;
    cancelUrl?: string | null;
    pickupRequest?: string | null;
    visitId?: string | null;
  }): Promise<void> {
    const { lead, site, scheduledAtStr, calBookingUid, rescheduleUrl, cancelUrl, pickupRequest, visitId } = params;

    const safeLeadName = escapeHtml(lead.name || 'Valued Guest');
    const safePhone = escapeHtml(lead.phone);
    const safeSiteName = escapeHtml(site?.name || 'Site Visit');
    const safeLocation = escapeHtml(site?.location || 'Hyderabad');
    const safeBudget = escapeHtml(lead.budget || 'Not specified');
    const safeTimeline = escapeHtml(lead.timeline || 'Not specified');
    const safeScore = escapeHtml(lead.score);
    const safeSummary = escapeHtml(lead.summary || 'None');
    const safePickup = escapeHtml(pickupRequest || 'None requested');
    const safeUid = escapeHtml(calBookingUid || 'N/A');
    const safeReschedule = escapeHtml(rescheduleUrl || `https://cal.com/reschedule/${calBookingUid}`);
    const safeCancel = escapeHtml(cancelUrl || `https://cal.com/cancel/${calBookingUid}`);

    const subject = `Site visit confirmed: ${lead.name || lead.phone} - ${site?.name || 'Property'} - ${scheduledAtStr}`;

    const text = `SITE VISIT CONFIRMED
---------------------
Lead: ${lead.name || 'Guest'} (${lead.phone})
Lead ID: ${lead.id}
Score: ${lead.score.toUpperCase()}
Site: ${site?.name || 'Property'}
Location: ${site?.location || ''}
Scheduled Time: ${scheduledAtStr}
Budget: ${lead.budget || 'Not specified'}
Timeline: ${lead.timeline || 'Not specified'}
Pickup Request: ${pickupRequest || 'None'}
Summary: ${lead.summary || 'None'}

Cal.com UID: ${calBookingUid || 'N/A'}
Reschedule Link: ${rescheduleUrl || 'N/A'}
Cancel Link: ${cancelUrl || 'N/A'}
`;

    const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
  <h2 style="color: #2b6cb0; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">🏡 New Site Visit Booked</h2>
  <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
    <tr><td style="padding: 6px; font-weight: bold; width: 140px;">Lead Name:</td><td style="padding: 6px;">${safeLeadName}</td></tr>
    <tr><td style="padding: 6px; font-weight: bold;">WhatsApp:</td><td style="padding: 6px;">${safePhone}</td></tr>
    <tr><td style="padding: 6px; font-weight: bold;">Lead ID:</td><td style="padding: 6px;"><small>${escapeHtml(lead.id)}</small></td></tr>
    <tr><td style="padding: 6px; font-weight: bold;">Score:</td><td style="padding: 6px;"><span style="background: #ebf8ff; color: #2b6cb0; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${safeScore.toUpperCase()}</span></td></tr>
    <tr><td style="padding: 6px; font-weight: bold;">Site:</td><td style="padding: 6px;">${safeSiteName}</td></tr>
    <tr><td style="padding: 6px; font-weight: bold;">Location:</td><td style="padding: 6px;">${safeLocation}</td></tr>
    <tr><td style="padding: 6px; font-weight: bold;">Date & Time:</td><td style="padding: 6px; color: #2c5282; font-weight: bold;">${escapeHtml(scheduledAtStr)}</td></tr>
    <tr><td style="padding: 6px; font-weight: bold;">Budget:</td><td style="padding: 6px;">${safeBudget}</td></tr>
    <tr><td style="padding: 6px; font-weight: bold;">Timeline:</td><td style="padding: 6px;">${safeTimeline}</td></tr>
    <tr><td style="padding: 6px; font-weight: bold;">Pickup Request:</td><td style="padding: 6px;">${safePickup}</td></tr>
    <tr><td style="padding: 6px; font-weight: bold;">Lead Summary:</td><td style="padding: 6px;">${safeSummary}</td></tr>
    <tr><td style="padding: 6px; font-weight: bold;">Cal.com UID:</td><td style="padding: 6px;">${safeUid}</td></tr>
  </table>
  <div style="margin-top: 20px; padding: 12px; background: #f7fafc; border-radius: 6px;">
    <a href="${safeReschedule}" style="display: inline-block; margin-right: 12px; color: #3182ce; text-decoration: none; font-weight: bold;">Reschedule Booking</a>
    <a href="${safeCancel}" style="display: inline-block; color: #e53e3e; text-decoration: none; font-weight: bold;">Cancel Booking</a>
  </div>
</div>
`;

    // 1. Send owner internal notification
    await this.enqueue({
      to: env.NOTIFY_EMAIL,
      subject,
      text,
      html,
      relatedLeadId: lead.id,
      relatedVisitId: visitId || null,
    });

    // 2. If lead provided an email, send confirmation copy to the lead
    if (lead.email && lead.email_provided) {
      const leadSubject = `Your Site Visit Confirmation - ${site?.name || 'Apex Estates'}`;
      const leadHtml = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2>Hello ${safeLeadName},</h2>
  <p>Thank you for scheduling a site visit to <strong>${safeSiteName}</strong>.</p>
  <p><strong>Scheduled Time:</strong> ${escapeHtml(scheduledAtStr)}<br/>
  <strong>Location:</strong> ${safeLocation}</p>
  <p>Need to make changes? You can manage your appointment here:</p>
  <p><a href="${safeReschedule}">Reschedule Appointment</a> | <a href="${safeCancel}">Cancel Appointment</a></p>
  <p>We look forward to welcoming you!</p>
</div>
`;
      await this.enqueue({
        to: lead.email,
        subject: leadSubject,
        text,
        html: leadHtml,
        relatedLeadId: lead.id,
        relatedVisitId: visitId || null,
      });
    }
  }

  /**
   * (b) HOT lead alert to NOTIFY_EMAIL
   */
  async notifyHotLead(lead: Lead, reason: string): Promise<void> {
    const subject = `🔥 HOT Lead Alert: ${lead.name || lead.phone}`;
    const safeName = escapeHtml(lead.name || 'Unknown');
    const safePhone = escapeHtml(lead.phone);
    const safeReason = escapeHtml(reason);
    const safeBudget = escapeHtml(lead.budget || 'Not specified');

    const text = `HOT LEAD DETECTED\nName: ${lead.name || 'Unknown'}\nPhone: ${lead.phone}\nReason: ${reason}\nBudget: ${lead.budget || 'N/A'}`;
    const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
  <h2 style="color: #c53030;">🔥 HOT Lead Alert</h2>
  <p><strong>Name:</strong> ${safeName}<br/>
  <strong>WhatsApp:</strong> ${safePhone}<br/>
  <strong>Qualification Reason:</strong> ${safeReason}<br/>
  <strong>Budget:</strong> ${safeBudget}</p>
</div>
`;

    await this.enqueue({
      to: env.NOTIFY_EMAIL,
      subject,
      text,
      html,
      relatedLeadId: lead.id,
    });
  }

  /**
   * (c) needs_attention / handoff alert with reason
   */
  async notifyNeedsAttention(lead: Lead, reason: string): Promise<void> {
    const subject = `⚠️ Lead Needs Attention: ${lead.name || lead.phone}`;
    const safeName = escapeHtml(lead.name || 'Unknown');
    const safePhone = escapeHtml(lead.phone);
    const safeReason = escapeHtml(reason);

    const text = `LEAD NEEDS ATTENTION\nName: ${lead.name || 'Unknown'}\nPhone: ${lead.phone}\nReason: ${reason}`;
    const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
  <h2 style="color: #dd6b20;">⚠️ Lead Needs Attention / Human Handoff</h2>
  <p><strong>Name:</strong> ${safeName}<br/>
  <strong>WhatsApp:</strong> ${safePhone}<br/>
  <strong>Reason:</strong> ${safeReason}</p>
</div>
`;

    await this.enqueue({
      to: env.NOTIFY_EMAIL,
      subject,
      text,
      html,
      relatedLeadId: lead.id,
    });
  }

  /**
   * (d) Booking cancelled or rescheduled notice
   */
  async notifyBookingStatusChange(params: {
    action: 'rescheduled' | 'cancelled';
    lead: Lead;
    siteName: string;
    newTimeStr?: string;
    reason?: string;
    calUid?: string;
  }): Promise<void> {
    const { action, lead, siteName, newTimeStr, reason, calUid } = params;
    const isCancel = action === 'cancelled';
    const subject = `${isCancel ? '❌ Visit Cancelled' : '🗓️ Visit Rescheduled'}: ${lead.name || lead.phone} - ${siteName}`;

    const text = `SITE VISIT ${action.toUpperCase()}\nLead: ${lead.name || 'Guest'} (${lead.phone})\nSite: ${siteName}\n${newTimeStr ? `New Time: ${newTimeStr}\n` : ''}Reason: ${reason || 'N/A'}\nCal UID: ${calUid || 'N/A'}`;
    const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
  <h2>${isCancel ? '❌ Site Visit Cancelled' : '🗓️ Site Visit Rescheduled'}</h2>
  <p><strong>Lead:</strong> ${escapeHtml(lead.name || 'Guest')} (${escapeHtml(lead.phone)})<br/>
  <strong>Site:</strong> ${escapeHtml(siteName)}<br/>
  ${newTimeStr ? `<strong>New Time:</strong> ${escapeHtml(newTimeStr)}<br/>` : ''}
  <strong>Reason:</strong> ${escapeHtml(reason || 'N/A')}<br/>
  <strong>Cal UID:</strong> ${escapeHtml(calUid || 'N/A')}</p>
</div>
`;

    await this.enqueue({
      to: env.NOTIFY_EMAIL,
      subject,
      text,
      html,
      relatedLeadId: lead.id,
    });
  }
}

export const emailService = new EmailService();
