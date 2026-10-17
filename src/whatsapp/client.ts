import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export interface InteractiveButton {
  id: string;
  title: string;
}

export interface InteractiveListSectionRow {
  id: string;
  title: string;
  description?: string;
}

export interface InteractiveListSection {
  title: string;
  rows: InteractiveListSectionRow[];
}

export interface TemplateComponentParameter {
  type: 'text' | 'image' | 'date_time';
  text?: string;
  image?: { link: string };
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  sub_type?: string;
  index?: string;
  parameters: TemplateComponentParameter[];
}

export interface SendMessageResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export class WhatsAppClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly phoneNumberId: string;

  constructor() {
    this.baseUrl = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}`;
    this.token = env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  }

  /**
   * Resilient HTTP request helper with exponential backoff for 429 and 5xx errors
   */
  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit,
    maxRetries = 3,
    initialDelayMs = 1000
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    let attempt = 0;
    let delay = initialDelayMs;

    while (attempt < maxRetries) {
      attempt++;
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
        });

        if (response.ok) {
          return (await response.json()) as T;
        }

        const status = response.status;
        const errText = await response.text();

        // Retry on Rate Limit (429) or Server Errors (500, 502, 503, 504)
        if ((status === 429 || status >= 500) && attempt < maxRetries) {
          logger.warn(
            { attempt, status, delayMs: delay },
            `WhatsApp API call failed with retryable status. Retrying in ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }

        throw new Error(`WhatsApp API error [${status}]: ${errText}`);
      } catch (err: any) {
        if (attempt >= maxRetries) {
          logger.error({ err, endpoint }, 'WhatsApp API call exceeded maximum retries');
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    throw new Error('Unexpected retry loop exit');
  }

  /**
   * Send a free-form text message to a WhatsApp user
   */
  async sendText(to: string, text: string): Promise<string> {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: true,
        body: text,
      },
    };

    const res = await this.requestWithRetry<SendMessageResponse>(`/${this.phoneNumberId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const msgId = res.messages?.[0]?.id || '';
    logger.info({ to, msgId }, 'WhatsApp text message dispatched');
    return msgId;
  }

  /**
   * Send an image message with optional caption
   */
  async sendImage(to: string, imageUrlOrMediaId: string, caption?: string): Promise<string> {
    const isUrl = imageUrlOrMediaId.startsWith('http://') || imageUrlOrMediaId.startsWith('https://');

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'image',
      image: isUrl
        ? { link: imageUrlOrMediaId, caption: caption || undefined }
        : { id: imageUrlOrMediaId, caption: caption || undefined },
    };

    const res = await this.requestWithRetry<SendMessageResponse>(`/${this.phoneNumberId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const msgId = res.messages?.[0]?.id || '';
    logger.info({ to, msgId }, 'WhatsApp image message dispatched');
    return msgId;
  }

  /**
   * Send interactive reply buttons (up to 3 buttons)
   */
  async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: InteractiveButton[],
    headerText?: string,
    footerText?: string
  ): Promise<string> {
    const formattedButtons = buttons.slice(0, 3).map((b) => ({
      type: 'reply',
      reply: {
        id: b.id,
        title: b.title.slice(0, 20), // WhatsApp enforces max 20 characters for button titles
      },
    }));

    const interactivePayload: Record<string, unknown> = {
      type: 'button',
      body: { text: bodyText },
      action: { buttons: formattedButtons },
    };

    if (headerText) {
      interactivePayload.header = { type: 'text', text: headerText };
    }
    if (footerText) {
      interactivePayload.footer = { text: footerText };
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: interactivePayload,
    };

    const res = await this.requestWithRetry<SendMessageResponse>(`/${this.phoneNumberId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return res.messages?.[0]?.id || '';
  }

  /**
   * Send interactive list menu
   */
  async sendInteractiveList(
    to: string,
    bodyText: string,
    buttonTitle: string,
    sections: InteractiveListSection[],
    headerText?: string,
    footerText?: string
  ): Promise<string> {
    const interactivePayload: Record<string, unknown> = {
      type: 'list',
      body: { text: bodyText },
      action: {
        button: buttonTitle.slice(0, 20),
        sections,
      },
    };

    if (headerText) {
      interactivePayload.header = { type: 'text', text: headerText };
    }
    if (footerText) {
      interactivePayload.footer = { text: footerText };
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: interactivePayload,
    };

    const res = await this.requestWithRetry<SendMessageResponse>(`/${this.phoneNumberId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return res.messages?.[0]?.id || '';
  }

  /**
   * Send pre-approved template message (required outside the 24-hour window)
   */
  async sendTemplate(
    to: string,
    templateName: string,
    languageCode = 'en',
    components?: TemplateComponent[]
  ): Promise<string> {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components: components || [],
      },
    };

    const res = await this.requestWithRetry<SendMessageResponse>(`/${this.phoneNumberId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const msgId = res.messages?.[0]?.id || '';
    logger.info({ to, templateName, msgId }, 'WhatsApp template message dispatched');
    return msgId;
  }

  /**
   * Mark incoming message as read
   */
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      };

      await this.requestWithRetry(`/${this.phoneNumberId}/messages`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return true;
    } catch (err) {
      // Non-fatal, just log debug
      logger.debug({ err, messageId }, 'Failed to mark message as read');
      return false;
    }
  }

  /**
   * Retrieve media URL from Meta Graph API using Media ID
   */
  async getMediaUrl(mediaId: string): Promise<{ url: string; mimeType: string }> {
    const data = await this.requestWithRetry<{ url: string; mime_type: string }>(`/${mediaId}`, {
      method: 'GET',
    });
    return {
      url: data.url,
      mimeType: data.mime_type,
    };
  }

  /**
   * Download media binary buffer from Meta's CDN URL using Bearer token
   */
  async downloadMedia(mediaUrl: string): Promise<Buffer> {
    const response = await fetch(mediaUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download WhatsApp media [${response.status}]: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Send audio voice note (.ogg/.opus)
   */
  async sendAudio(to: string, audioUrlOrMediaId: string): Promise<string> {
    const isUrl = audioUrlOrMediaId.startsWith('http://') || audioUrlOrMediaId.startsWith('https://');

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'audio',
      audio: isUrl ? { link: audioUrlOrMediaId } : { id: audioUrlOrMediaId },
    };

    const res = await this.requestWithRetry<SendMessageResponse>(`/${this.phoneNumberId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return res.messages?.[0]?.id || '';
  }
}

export const whatsAppClient = new WhatsAppClient();
