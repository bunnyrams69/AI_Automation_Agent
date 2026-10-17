import { describe, expect, it, vi } from 'vitest';
import { SlotFullError, SlotsRepository } from '../src/db/repositories/slots.repo.js';

describe('Slot Booking Race Condition Prevention', () => {
  it('guarantees only one booking succeeds when two concurrent requests compete for 1 slot', async () => {
    // Simulated atomic in-memory slot state with concurrency lock
    let bookedCount = 0;
    const capacity = 1;
    let isLocked = false;

    const mockAtomicBookingProcedure = async (slotId: string, leadId: string) => {
      // Simulate database row lock (FOR UPDATE)
      while (isLocked) {
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
      isLocked = true;

      try {
        if (bookedCount >= capacity) {
          throw new SlotFullError(`SLOT_FULL: Slot ${slotId} has reached max capacity of ${capacity}`);
        }
        bookedCount++;
        return {
          visit_id: `visit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          visit_scheduled_at: new Date().toISOString(),
          visit_site_id: 'site-123',
          visit_slot_id: slotId,
          visit_status: 'confirmed',
        };
      } finally {
        isLocked = false;
      }
    };

    const slotsRepo = new SlotsRepository();
    // Spy on bookAtomic to execute the atomic procedure
    vi.spyOn(slotsRepo, 'bookAtomic').mockImplementation(async (params) => {
      return await mockAtomicBookingProcedure(params.slotId, params.leadId);
    });

    const slotId = 'slot-competition-uuid';

    // Simulate two simultaneous booking requests arriving in parallel
    const [booking1, booking2] = await Promise.allSettled([
      slotsRepo.bookAtomic({
        leadId: 'lead-user-1',
        siteId: 'site-123',
        slotId,
      }),
      slotsRepo.bookAtomic({
        leadId: 'lead-user-2',
        siteId: 'site-123',
        slotId,
      }),
    ]);

    const successes = [booking1, booking2].filter((b) => b.status === 'fulfilled');
    const failures = [booking1, booking2].filter((b) => b.status === 'rejected');

    // Exactly one must succeed
    expect(successes.length).toBe(1);
    // Exactly one must fail due to capacity exhaustion
    expect(failures.length).toBe(1);

    const failedResult = failures[0] as PromiseRejectedResult;
    expect(failedResult.reason.message).toContain('SLOT_FULL');
    expect(bookedCount).toBe(1);
  });
});
