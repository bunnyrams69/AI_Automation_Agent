import { describe, it, expect } from 'vitest';
import { parseBudget } from '../src/agent/budget.js';

describe('Budget Parser', () => {
  it('normalizes "1core" to 10,000,000 INR', () => {
    const result = parseBudget('1core');
    expect(result.is_valid).toBe(true);
    expect(result.budget_min_inr).toBe(10_000_000);
    expect(result.budget_max_inr).toBe(10_000_000);
    expect(result.budget_text).toBe('₹1 Cr');
    expect(result.confirmation_phrase).toMatch(/Rs 1 crore/i);
  });

  it('normalizes "1.5 cr" to 15,000,000 INR', () => {
    const result = parseBudget('1.5 cr');
    expect(result.is_valid).toBe(true);
    expect(result.budget_min_inr).toBe(15_000_000);
    expect(result.budget_max_inr).toBe(15_000_000);
    expect(result.budget_text).toBe('₹1.5 Cr');
    expect(result.confirmation_phrase).toMatch(/Rs 1.5 crore/i);
  });

  it('normalizes "50-60 lakhs"', () => {
    const result = parseBudget('50-60 lakhs');
    expect(result.is_valid).toBe(true);
    expect(result.budget_min_inr).toBe(5_000_000);
    expect(result.budget_max_inr).toBe(6_000_000);
    expect(result.confirmation_phrase).toMatch(/50 lakhs.*60 lakhs/i);
  });

  it('normalizes "under 80L"', () => {
    const result = parseBudget('under 80L');
    expect(result.is_valid).toBe(true);
    expect(result.budget_min_inr).toBeNull();
    expect(result.budget_max_inr).toBe(8_000_000);
    expect(result.confirmation_phrase).toMatch(/up to Rs 80 lakhs/i);
  });

  it('handles ambiguous bare number', () => {
    const result = parseBudget('100');
    expect(result.is_ambiguous).toBe(true);
    expect(result.clarification_question).toBeTruthy();
  });

  it('non-budget inputs return invalid without throwing', () => {
    expect(() => {
      const res1 = parseBudget('start conversion immediately');
      expect(res1.is_valid).toBe(false);
      const res2 = parseBudget(null);
      expect(res2.is_valid).toBe(false);
      const res3 = parseBudget('');
      expect(res3.is_valid).toBe(false);
    }).not.toThrow();
  });
});
