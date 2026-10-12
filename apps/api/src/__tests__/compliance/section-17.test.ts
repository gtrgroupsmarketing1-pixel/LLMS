import { describe, it, expect } from 'vitest';
import { COUNTRY_RULES, getCountryRule } from '@lmms/compliance';
import { isOptOutKeyword } from '@lmms/whatsapp';

describe('compliance audit — PRD §17', () => {
  it('covers all 8 GCC jurisdictions', () => {
    const codes = COUNTRY_RULES.map((r) => r.country).sort();
    expect(codes).toEqual(['AE', 'AE_ADGM', 'AE_DIFC', 'BH', 'KW', 'OM', 'QA', 'SA']);
  });

  it('every rule mandates >=3-year audit retention', () => {
    for (const r of COUNTRY_RULES) {
      expect(r.retentionDays.audit).toBeGreaterThanOrEqual(1095);
    }
  });

  it('Saudi Arabia requires prior consent (PDPL Art. 25)', () => {
    expect(getCountryRule('SA').marketingConsent).toBe('PRIOR');
  });

  it('UAE onshore requires express consent', () => {
    expect(getCountryRule('AE').marketingConsent).toBe('EXPRESS');
  });

  it('DIFC/ADGM permit soft opt-in for similar products', () => {
    expect(getCountryRule('AE_DIFC').marketingConsent).toBe('SOFT_OPT_IN');
    expect(getCountryRule('AE_ADGM').marketingConsent).toBe('SOFT_OPT_IN');
  });

  it('SMS sender ID required for regulated markets', () => {
    for (const c of ['AE', 'SA', 'KW', 'QA', 'BH', 'OM']) {
      expect(getCountryRule(c).smsSenderIdRequired).toBe(true);
    }
  });

  it('opt-out keywords cover Arabic and English', () => {
    for (const kw of ['STOP', 'إلغاء', 'إيقاف', 'unsubscribe']) {
      expect(isOptOutKeyword(kw)).toBe(true);
    }
  });
});
