/**
 * Budget Normalizer & Parser
 *
 * Deterministically normalizes Indian real-estate free-text budget phrases
 * into structured numeric INR values and standardized human-friendly labels.
 *
 * Handles:
 * - crore, cr, core, karod, koti = 10,000,000
 * - lakh, lac, lakhs, lacs, l = 100,000
 * - k, thousand = 1,000
 * - Ranges: "50-60 lakhs", "1 to 1.5 cr", "50L - 1Cr"
 * - Modifiers: "under 80L", "up to 1.2 cr", "above 50 lakhs", "around 1core"
 */

export interface NormalizedBudget {
  raw_input: string;
  is_valid: boolean;
  is_ambiguous: boolean;
  budget_text: string | null;
  budget_min_inr: number | null;
  budget_max_inr: number | null;
  confirmation_phrase: string | null;
  clarification_question: string | null;
}

const CRORE_MULT = 10_000_000;
const LAKH_MULT = 100_000;
const THOUSAND_MULT = 1_000;

function formatInrWords(amount: number): string {
  if (amount >= CRORE_MULT) {
    const cr = amount / CRORE_MULT;
    return `Rs ${Number(cr.toFixed(2))} crore`;
  }
  if (amount >= LAKH_MULT) {
    const l = amount / LAKH_MULT;
    return `Rs ${Number(l.toFixed(2))} lakhs`;
  }
  if (amount >= THOUSAND_MULT) {
    const k = amount / THOUSAND_MULT;
    return `Rs ${Number(k.toFixed(1))}k`;
  }
  return `Rs ${amount.toLocaleString('en-IN')}`;
}

function formatInrDisplay(amount: number): string {
  if (amount >= CRORE_MULT) {
    const cr = amount / CRORE_MULT;
    return `₹${Number(cr.toFixed(2))} Cr`;
  }
  if (amount >= LAKH_MULT) {
    const l = amount / LAKH_MULT;
    return `₹${Number(l.toFixed(2))} Lakhs`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

function parseUnitMultiplier(unitStr: string): number | null {
  const u = unitStr.toLowerCase().trim();
  if (/^(cr|crore|crores|core|cores|karod|karods|koti|kotlu)$/.test(u)) {
    return CRORE_MULT;
  }
  if (/^(l|lac|lacs|lakh|lakhs)$/.test(u)) {
    return LAKH_MULT;
  }
  if (/^(k|thousand|thousands)$/.test(u)) {
    return THOUSAND_MULT;
  }
  return null;
}

export function parseBudget(input: string | null | undefined): NormalizedBudget {
  const result: NormalizedBudget = {
    raw_input: input || '',
    is_valid: false,
    is_ambiguous: false,
    budget_text: null,
    budget_min_inr: null,
    budget_max_inr: null,
    confirmation_phrase: null,
    clarification_question: null,
  };

  if (!input || typeof input !== 'string') {
    return result;
  }

  const clean = input
    .toLowerCase()
    .replace(/₹|rs\.?|inr/g, ' ')
    .replace(/,/g, '')
    .trim();

  if (!clean) return result;

  try {
    // 1. Range match: e.g. "50-60 lakhs", "50 to 60 lac", "1 - 1.5 cr", "50l - 1cr"
    const rangeRegex =
      /(\d+(?:\.\d+)?)\s*(cr|crore|core|karod|koti|l|lac|lakh|k)?\s*(?:-|to|\/)\s*(\d+(?:\.\d+)?)\s*(cr|crore|core|karod|koti|l|lac|lakh|k)/i;
    const rangeMatch = clean.match(rangeRegex);

    if (rangeMatch) {
      const num1 = parseFloat(rangeMatch[1]);
      const unit1 = rangeMatch[2] ? parseUnitMultiplier(rangeMatch[2]) : null;
      const num2 = parseFloat(rangeMatch[3]);
      const unit2 = parseUnitMultiplier(rangeMatch[4]);

      if (unit2) {
        const mult1 = unit1 || unit2;
        const minVal = Math.round(num1 * mult1);
        const maxVal = Math.round(num2 * unit2);

        result.is_valid = true;
        result.budget_min_inr = Math.min(minVal, maxVal);
        result.budget_max_inr = Math.max(minVal, maxVal);
        result.budget_text = `${formatInrDisplay(result.budget_min_inr)} - ${formatInrDisplay(result.budget_max_inr)}`;
        result.confirmation_phrase = `Noted, between ${formatInrWords(result.budget_min_inr)} and ${formatInrWords(result.budget_max_inr)}`;
        return result;
      }
    }

    // 2. Upper bound match: "under 80L", "below 1.2 cr", "max 75 lakhs", "up to 1core", "less than 2cr"
    const maxRegex =
      /(?:under|below|less\s+than|up\s+to|upto|within|max(?:imum)?)\s*(\d+(?:\.\d+)?)\s*(cr|crore|core|karod|koti|l|lac|lakh|k)?/i;
    const maxMatch = clean.match(maxRegex);
    if (maxMatch) {
      const num = parseFloat(maxMatch[1]);
      const unit = maxMatch[2] ? parseUnitMultiplier(maxMatch[2]) : null;
      if (unit) {
        const val = Math.round(num * unit);
        result.is_valid = true;
        result.budget_min_inr = null;
        result.budget_max_inr = val;
        result.budget_text = `Up to ${formatInrDisplay(val)}`;
        result.confirmation_phrase = `Noted, up to ${formatInrWords(val)}`;
        return result;
      }
    }

    // 3. Lower bound match: "above 50 lakhs", "min 1 cr", "minimum 80l", "more than 1core"
    const minRegex =
      /(?:above|more\s+than|greater\s+than|over|min(?:imum)?)\s*(\d+(?:\.\d+)?)\s*(cr|crore|core|karod|koti|l|lac|lakh|k)?/i;
    const minMatch = clean.match(minRegex);
    if (minMatch) {
      const num = parseFloat(minMatch[1]);
      const unit = minMatch[2] ? parseUnitMultiplier(minMatch[2]) : null;
      if (unit) {
        const val = Math.round(num * unit);
        result.is_valid = true;
        result.budget_min_inr = val;
        result.budget_max_inr = null;
        result.budget_text = `Above ${formatInrDisplay(val)}`;
        result.confirmation_phrase = `Noted, above ${formatInrWords(val)}`;
        return result;
      }
    }

    // 4. Exact / Approx match with unit: "1core", "1.5 cr", "50 lakhs", "around 1 cr", "approx 80L"
    const singleRegex =
      /(?:around|approx(?:imately)?|about)?\s*(\d+(?:\.\d+)?)\s*(cr|crore|cores?|core|karods?|karod|koti|kotlu|l|lacs?|lac|lakhs?|lakh|k)\b/i;
    const singleMatch = clean.match(singleRegex);
    if (singleMatch) {
      const num = parseFloat(singleMatch[1]);
      const unit = parseUnitMultiplier(singleMatch[2]);
      if (unit) {
        const val = Math.round(num * unit);
        result.is_valid = true;
        result.budget_min_inr = val;
        result.budget_max_inr = val;
        result.budget_text = formatInrDisplay(val);
        result.confirmation_phrase = `Noted, around ${formatInrWords(val)}`;
        return result;
      }
    }

    // 5. Raw numeric inputs (e.g. "10000000" or "7500000")
    const rawNumberMatch = clean.match(/\b(\d{5,9})\b/);
    if (rawNumberMatch) {
      const val = parseInt(rawNumberMatch[1], 10);
      result.is_valid = true;
      result.budget_min_inr = val;
      result.budget_max_inr = val;
      result.budget_text = formatInrDisplay(val);
      result.confirmation_phrase = `Noted, around ${formatInrWords(val)}`;
      return result;
    }

    // 6. Ambiguous bare numbers: e.g. "50", "100", "1.5" without any unit
    const bareNumMatch = clean.match(/^\s*(\d+(?:\.\d+)?)\s*$/);
    if (bareNumMatch) {
      const n = parseFloat(bareNumMatch[1]);
      result.is_ambiguous = true;
      if (n <= 10) {
        result.clarification_question = `Could you clarify if your budget is Rs ${n} Crore or Rs ${n} Lakhs?`;
      } else {
        result.clarification_question = `Could you clarify if your budget is Rs ${n} Lakhs or something else?`;
      }
      return result;
    }

    return result;
  } catch (err) {
    // Parsing failure must not throw
    return result;
  }
}
