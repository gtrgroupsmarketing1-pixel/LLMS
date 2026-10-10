export type ConsentModel = 'EXPRESS' | 'SOFT_OPT_IN' | 'PRIOR';

export interface CountryRule {
  country: string;
  regulator: string;
  law: string;
  marketingConsent: ConsentModel;
  smsSenderIdRequired: boolean;
  retentionDays: {
    consent: number;
    marketing: number;
    audit: number;
    transaction: number;
  };
  erasureWindowDays: number;
  notes?: string;
}

export const COUNTRY_RULES: CountryRule[] = [
  {
    country: 'AE',
    regulator: 'TDRA',
    law: 'Federal Decree-Law No. 45 of 2021',
    marketingConsent: 'EXPRESS',
    smsSenderIdRequired: true,
    retentionDays: { consent: 1095, marketing: 730, audit: 1095, transaction: 1825 },
    erasureWindowDays: 30,
  },
  {
    country: 'AE_DIFC',
    regulator: 'DIFC',
    law: 'DIFC DP Law 2020',
    marketingConsent: 'SOFT_OPT_IN',
    smsSenderIdRequired: false,
    retentionDays: { consent: 1095, marketing: 730, audit: 1095, transaction: 1825 },
    erasureWindowDays: 30,
  },
  {
    country: 'AE_ADGM',
    regulator: 'ADGM',
    law: 'ADGM DP Regulations 2021',
    marketingConsent: 'SOFT_OPT_IN',
    smsSenderIdRequired: false,
    retentionDays: { consent: 1095, marketing: 730, audit: 1095, transaction: 1825 },
    erasureWindowDays: 30,
  },
  {
    country: 'SA',
    regulator: 'CST',
    law: 'PDPL (Royal Decree M/19) Art. 25',
    marketingConsent: 'PRIOR',
    smsSenderIdRequired: true,
    retentionDays: { consent: 1095, marketing: 730, audit: 1095, transaction: 1825 },
    erasureWindowDays: 30,
  },
  {
    country: 'KW',
    regulator: 'CITRA',
    law: 'Data Privacy Protection Regulation',
    marketingConsent: 'EXPRESS',
    smsSenderIdRequired: true,
    retentionDays: { consent: 730, marketing: 365, audit: 1095, transaction: 1825 },
    erasureWindowDays: 30,
  },
  {
    country: 'QA',
    regulator: 'CRA',
    law: 'PDPPL (Law No. 13 of 2016)',
    marketingConsent: 'EXPRESS',
    smsSenderIdRequired: true,
    retentionDays: { consent: 730, marketing: 365, audit: 1095, transaction: 1825 },
    erasureWindowDays: 30,
  },
  {
    country: 'BH',
    regulator: 'TRA',
    law: 'PDPL (Law No. 30 of 2018)',
    marketingConsent: 'EXPRESS',
    smsSenderIdRequired: true,
    retentionDays: { consent: 730, marketing: 365, audit: 1095, transaction: 1825 },
    erasureWindowDays: 30,
  },
  {
    country: 'OM',
    regulator: 'TRA',
    law: 'PDPL (Royal Decree 6/2022)',
    marketingConsent: 'EXPRESS',
    smsSenderIdRequired: true,
    retentionDays: { consent: 730, marketing: 365, audit: 1095, transaction: 1825 },
    erasureWindowDays: 30,
  },
];

export function getCountryRule(country: string): CountryRule {
  const rule = COUNTRY_RULES.find((r) => r.country === country);
  if (!rule) throw new Error(`unknown_country:${country}`);
  return rule;
}
