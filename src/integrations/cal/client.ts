import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

export interface CalAttendee {
  name: string;
  email: string;
  timeZone: string;
  phoneNumber?: string;
  language?: string;
}

export interface CreateBookingInput {
  start: string; // ISO 8601 UTC
  eventTypeId: number;
  attendee: CalAttendee;
  metadata?: Record<string, any>;
  bookingFieldsResponses?: Record<string, any>;
}

export interface RescheduleBookingInput {
  uid: string;
  start: string; // ISO 8601 UTC
  rescheduleReason?: string;
}

export interface CancelBookingInput {
  uid: string;
  cancellationReason?: string;
}

export interface CalBooking {
  id: number | string;
  uid: string;
  title: string;
  description?: string;
  hosts?: Array<{ id: number; name: string; email: string; username?: string }>;
  status: 'ACCEPTED' | 'PENDING' | 'CANCELLED' | 'REJECTED';
  start: string;
  end: string;
  duration?: number;
  eventTypeId?: number;
  rescheduleUrl?: string;
  cancelUrl?: string;
  meetingUrl?: string;
  location?: string;
  metadata?: Record<string, any>;
}

export interface CalSlotItem {
  start: string; // ISO string
}

export class CalClient {
  private readonly baseUrl = 'https://api.cal.com/v2';
  private readonly timeoutMs = 15000;

  private get apiKey(): string {
    return env.CAL_API_KEY;
  }

  private get bookingsVersion(): string {
    return env.CAL_API_VERSION || '2024-08-13';
  }

  private get slotsVersion(): string {
    return env.CAL_SLOTS_API_VERSION || '2024-09-04';
  }

  /**
   * Safe fetch with automatic retry on 429/5xx, timeouts, and no key logging
   */
  private async request<T>(
    path: string,
    options: {
      method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
      body?: any;
      apiVersion: string;
      maxRetries?: number;
    }
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const method = options.method || 'GET';
    const maxRetries = options.maxRetries ?? 2;
    let attempt = 0;
    let delayMs = 1000;

    while (attempt <= maxRetries) {
      attempt++;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${this.apiKey}`,
          'cal-api-version': options.apiVersion,
          'Content-Type': 'application/json',
        };

        const res = await fetch(url, {
          method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (res.ok) {
          const json: any = await res.json();
          // Cal v2 returns { status: "success", data: ... }
          return (json.data !== undefined ? json.data : json) as T;
        }

        const status = res.status;
        const errText = await res.text();
        let parsedErr: any = errText;
        try {
          parsedErr = JSON.parse(errText);
        } catch {
          // Keep raw string
        }

        const isTransient = status === 429 || status >= 500;
        if (isTransient && attempt <= maxRetries) {
          logger.warn(
            { status, path, attempt, delayMs },
            'Cal.com API returned transient error. Retrying with backoff...'
          );
          await new Promise((r) => setTimeout(r, delayMs));
          delayMs *= 2;
          continue;
        }

        // On 4xx errors, fail immediately without retry
        const errMsg =
          parsedErr?.message || parsedErr?.error?.message || `Cal.com API error ${status} on ${path}`;
        const error: any = new Error(errMsg);
        error.status = status;
        error.details = parsedErr;
        throw error;
      } catch (err: any) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
          throw new Error(`Cal.com request to ${path} timed out after ${this.timeoutMs}ms`);
        }
        if (err.status && err.status < 500 && err.status !== 429) {
          throw err;
        }
        if (attempt <= maxRetries) {
          logger.warn({ err: err.message, path, attempt, delayMs }, 'Cal.com network error, retrying...');
          await new Promise((r) => setTimeout(r, delayMs));
          delayMs *= 2;
          continue;
        }
        throw err;
      }
    }

    throw new Error(`Cal.com request failed after ${maxRetries} retries`);
  }

  /**
   * Fetch available open booking slots for an event type between two ISO timestamps
   */
  async getSlots(
    eventTypeId: number,
    startTime: string,
    endTime: string
  ): Promise<Record<string, CalSlotItem[]>> {
    const query = new URLSearchParams({
      eventTypeId: String(eventTypeId),
      startTime,
      endTime,
    });

    const data = await this.request<any>(`/slots?${query.toString()}`, {
      method: 'GET',
      apiVersion: this.slotsVersion,
    });

    // Cal v2 returns { slots: { "2026-10-18": [ { start: "2026-10-18T09:00:00Z" } ] } }
    if (data && typeof data === 'object' && data.slots) {
      return data.slots as Record<string, CalSlotItem[]>;
    }
    return (data || {}) as Record<string, CalSlotItem[]>;
  }

  /**
   * Create a new confirmed booking in Cal.com
   */
  async createBooking(input: CreateBookingInput): Promise<CalBooking> {
    const payload: Record<string, any> = {
      start: input.start,
      eventTypeId: input.eventTypeId,
      attendee: input.attendee,
    };

    if (input.metadata) {
      payload.metadata = input.metadata;
    }
    if (input.bookingFieldsResponses) {
      payload.bookingFieldsResponses = input.bookingFieldsResponses;
    }

    const booking = await this.request<CalBooking>('/bookings', {
      method: 'POST',
      body: payload,
      apiVersion: this.bookingsVersion,
    });

    return booking;
  }

  /**
   * Get an existing booking by its UID
   */
  async getBooking(uid: string): Promise<CalBooking> {
    return this.request<CalBooking>(`/bookings/${encodeURIComponent(uid)}`, {
      method: 'GET',
      apiVersion: this.bookingsVersion,
    });
  }

  /**
   * Cancel an existing booking by UID
   */
  async cancelBooking(uid: string, cancellationReason = 'Requested by customer'): Promise<any> {
    return this.request<any>(`/bookings/${encodeURIComponent(uid)}/cancel`, {
      method: 'POST',
      body: { cancellationReason },
      apiVersion: this.bookingsVersion,
    });
  }

  /**
   * Reschedule an existing booking to a new start time
   */
  async rescheduleBooking(
    uid: string,
    newStart: string,
    rescheduleReason = 'Rescheduled by customer'
  ): Promise<CalBooking> {
    return this.request<CalBooking>(`/bookings/${encodeURIComponent(uid)}/reschedule`, {
      method: 'POST',
      body: {
        start: newStart,
        rescheduleReason,
      },
      apiVersion: this.bookingsVersion,
    });
  }

  /**
   * Health check verifying API key validity and default event type existence
   */
  async checkHealth(): Promise<{
    ok: boolean;
    user?: any;
    defaultEventType?: any;
    error?: string;
  }> {
    try {
      const me = await this.request<any>('/me', {
        method: 'GET',
        apiVersion: this.bookingsVersion,
      });

      let defaultEventType: any = null;
      try {
        const eventTypes = await this.request<any[]>('/event-types', {
          method: 'GET',
          apiVersion: '2024-06-11',
        });
        if (Array.isArray(eventTypes)) {
          defaultEventType =
            eventTypes.find((et) => Number(et.id) === Number(env.CAL_DEFAULT_EVENT_TYPE_ID)) || null;
        }
      } catch (etErr) {
        logger.warn({ etErr }, 'Failed to fetch event types list during Cal health check');
      }

      return {
        ok: true,
        user: {
          id: me.id,
          username: me.username,
          email: me.email,
          timeZone: me.timeZone,
        },
        defaultEventType: defaultEventType
          ? {
              id: defaultEventType.id,
              title: defaultEventType.title,
              slug: defaultEventType.slug,
              length: defaultEventType.length,
            }
          : null,
      };
    } catch (err: any) {
      return {
        ok: false,
        error: err.message || 'Cal.com health check failed',
      };
    }
  }
}

export const calClient = new CalClient();
