import { describe, it, expect } from 'vitest';
import { COUNTRY_RULES, getCountryRule } from '@lmms/compliance';
import { isOptOutKeyword } from '@lmms/whatsapp';
import { CONFIDENCE_BY_SOURCE } from '@lmms/attribution';
import { computeDunning, DUNNING_SCHEDULE } from '@lmms/billing';
import { GEO_PRESETS } from '@lmms/ads';
import { GCC_TEMPLATE_LIBRARY } from '@lmms/content-calendar';
import { RESPONSE_TEMPLATES } from '@lmms/reviews';

describe('V2 compliance and locale coverage', () => {
  it('still covers all 8 GCC jurisdictions', () => {
    const codes = COUNTRY_RULES.map((r) => r.country).sort();
    expect(codes).toEqual(['AE', 'AE_ADGM', 'AE_DIFC', 'BH', 'KW', 'OM', 'QA', 'SA']);
  });

  it('every jurisdiction keeps >=3-year audit retention', () => {
    for (const r of COUNTRY_RULES) {
      expect(r.retentionDays.audit).toBeGreaterThanOrEqual(1095);
    }
  });

  it('Saudi Arabia still requires prior consent', () => {
    expect(getCountryRule('SA').marketingConsent).toBe('PRIOR');
  });

  it('opt-out keywords cover AR and EN', () => {
    for (const kw of ['STOP', 'إلغاء', 'إيقاف', 'unsubscribe']) {
      expect(isOptOutKeyword(kw)).toBe(true);
    }
  });

  it('attribution never overstates: promo + ERP are HIGH only', () => {
    expect(CONFIDENCE_BY_SOURCE.PROMO_CODE).toBe('HIGH');
    expect(CONFIDENCE_BY_SOURCE.ERP_ORDER_MATCH).toBe('HIGH');
    expect(CONFIDENCE_BY_SOURCE.UTM).toBe('MEDIUM');
    expect(CONFIDENCE_BY_SOURCE.CALL_TRACKING).toBe('ESTIMATED');
    expect(CONFIDENCE_BY_SOURCE.MANUAL).toBe('ESTIMATED');
  });

  it('dunning schedule matches PRD', () => {
    const days = DUNNING_SCHEDULE.map((s) => s.daysPastDue);
    expect(days).toContain(1);
    expect(days).toContain(5);
    expect(days).toContain(10);
    expect(days).toContain(15);
    expect(days).toContain(30);
  });

  it('dunning compute handles past-due invoices', () => {
    const dueDate = new Date(Date.now() - 12 * 86_400_000);
    const result = computeDunning(dueDate);
    expect(result.daysPastDue).toBeGreaterThanOrEqual(11);
    expect(result.stepsDue.length).toBeGreaterThanOrEqual(3);
  });

  it('dunning returns 0 for future invoices', () => {
    const dueDate = new Date(Date.now() + 5 * 86_400_000);
    const result = computeDunning(dueDate);
    expect(result.daysPastDue).toBe(0);
    expect(result.stepsDue.length).toBe(0);
  });

  it('GCC ad geo presets cover every target country', () => {
    const countries = new Set(GEO_PRESETS.map((g) => g.country));
    for (const c of ['AE', 'SA', 'KW', 'QA', 'BH', 'OM']) {
      expect(countries.has(c)).toBe(true);
    }
  });

  it('GCC content template library has AR and EN copies', () => {
    for (const t of GCC_TEMPLATE_LIBRARY) {
      expect(t.suggestedCopyAr.length).toBeGreaterThan(0);
      expect(t.suggestedCopyEn.length).toBeGreaterThan(0);
    }
  });

  it('review response templates cover AR and EN for critical topics', () => {
    const langs = new Set(RESPONSE_TEMPLATES.map((t) => t.language));
    expect(langs.has('ar')).toBe(true);
    expect(langs.has('en')).toBe(true);
    const quality = RESPONSE_TEMPLATES.filter((t) => t.topic === 'SERVICE_QUALITY');
    expect(quality.some((t) => t.language === 'ar')).toBe(true);
    expect(quality.some((t) => t.language === 'en')).toBe(true);
  });
});
