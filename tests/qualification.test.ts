import { describe, expect, it } from 'vitest';
import { evaluateLeadQualification } from '../src/agent/qualification.js';

describe('Lead Qualification Engine', () => {
  it('classifies as HOT when customer directly requests to visit/book', () => {
    const result = evaluateLeadQualification(
      { id: 'lead-1', budget: '₹50 Lakhs' },
      { explicitBookingRequest: true }
    );
    expect(result.score).toBe('hot');
    expect(result.reason).toContain('requested a site visit');
  });

  it('classifies as HOT when timeline is <= 30 days and budget is specified', () => {
    const result = evaluateLeadQualification(
      { id: 'lead-2', budget: '₹3 Cr', timeline: 'Within 2 weeks' },
      { timelineDays: 14, budgetSpecified: true, hasIntentToVisit: true }
    );
    expect(result.score).toBe('hot');
  });

  it('classifies as WARM when inquiring with timeline > 30 days', () => {
    const result = evaluateLeadQualification(
      { id: 'lead-3', budget: '₹40 Lakhs' },
      { timelineDays: 60, preferredLocationSpecified: true }
    );
    expect(result.score).toBe('warm');
  });

  it('classifies as WARM when asking questions but budget/timeline still forming', () => {
    const result = evaluateLeadQualification(
      { id: 'lead-4', preferred_location: 'Mokila' },
      {}
    );
    expect(result.score).toBe('warm');
  });

  it('classifies as COLD when casually browsing with no timeline or budget', () => {
    const result = evaluateLeadQualification(
      { id: 'lead-5' },
      { isBrowsingOnly: true }
    );
    expect(result.score).toBe('cold');
  });

  it('classifies as COLD when off-topic or disengaged', () => {
    const result = evaluateLeadQualification(
      { id: 'lead-6' },
      { isOffTopicOrDisengaged: true }
    );
    expect(result.score).toBe('cold');
  });
});
