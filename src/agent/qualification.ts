import { Lead, LeadScore } from '../db/types.js';

export interface QualificationSignals {
  hasIntentToVisit?: boolean;
  budgetSpecified?: boolean;
  timelineDays?: number | null; // e.g. <= 30 days
  preferredLocationSpecified?: boolean;
  explicitBookingRequest?: boolean;
  isOffTopicOrDisengaged?: boolean;
  isBrowsingOnly?: boolean;
}

export interface QualificationResult {
  score: LeadScore;
  reason: string;
}

/**
 * Lead Qualification Rule Engine
 * Thresholds are configurable and documented:
 * - HOT: Clear intent to visit/buy within <= 30 days AND (budget or timeline stated), OR direct request to book/visit.
 * - WARM: Engaged, asking questions, but timeline > 30 days or budget/intent still forming.
 * - COLD: Just browsing, vague, unresponsive, off-topic, or explicit lack of budget/timeline.
 */
export function evaluateLeadQualification(
  currentLead: Partial<Lead>,
  signals: QualificationSignals
): QualificationResult {
  // 1. Check for HOT criteria
  if (
    signals.explicitBookingRequest ||
    signals.hasIntentToVisit ||
    currentLead.intent_to_visit
  ) {
    if (
      signals.explicitBookingRequest ||
      (signals.timelineDays !== null && signals.timelineDays !== undefined && signals.timelineDays <= 30) ||
      Boolean(currentLead.budget) ||
      signals.budgetSpecified
    ) {
      return {
        score: 'hot',
        reason: 'Lead requested a site visit or has <=30 day timeline with identified budget/interest.',
      };
    }
  }

  // 2. Check for COLD criteria
  if (signals.isOffTopicOrDisengaged || signals.isBrowsingOnly) {
    return {
      score: 'cold',
      reason: 'Lead stated they are casually browsing or shows low engagement without buying timeline.',
    };
  }

  // 3. Check for WARM criteria
  const hasSomeEngagement =
    Boolean(currentLead.budget) ||
    Boolean(currentLead.timeline) ||
    Boolean(currentLead.preferred_location) ||
    Boolean(currentLead.preferred_site_id) ||
    signals.budgetSpecified ||
    signals.preferredLocationSpecified ||
    (signals.timelineDays && signals.timelineDays > 30);

  if (hasSomeEngagement) {
    return {
      score: 'warm',
      reason: 'Lead is actively inquiring about property details or pricing, with timeline >30 days or pending budget details.',
    };
  }

  // Default initial or unscored state
  return {
    score: currentLead.score && currentLead.score !== 'unscored' ? currentLead.score : 'warm',
    reason: 'Initial qualification in progress.',
  };
}
