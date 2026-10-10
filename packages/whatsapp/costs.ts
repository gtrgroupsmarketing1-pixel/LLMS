export interface CostRate {
  country: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION' | 'SERVICE';
  amount: number;
  currency: string;
}

// PRD Appendix C
export const COST_RATES: CostRate[] = [
  { country: 'AE', category: 'MARKETING', amount: 0.17, currency: 'AED' },
  { country: 'AE', category: 'UTILITY', amount: 0.053, currency: 'AED' },
  { country: 'AE', category: 'AUTHENTICATION', amount: 0.053, currency: 'AED' },
  { country: 'AE', category: 'SERVICE', amount: 0, currency: 'AED' },
  { country: 'SA', category: 'MARKETING', amount: 0.16, currency: 'SAR' },
  { country: 'SA', category: 'UTILITY', amount: 0.051, currency: 'SAR' },
  { country: 'SA', category: 'AUTHENTICATION', amount: 0.051, currency: 'SAR' },
  { country: 'SA', category: 'SERVICE', amount: 0, currency: 'SAR' },
  { country: 'QA', category: 'MARKETING', amount: 0.15, currency: 'QAR' },
  { country: 'QA', category: 'UTILITY', amount: 0.048, currency: 'QAR' },
  { country: 'QA', category: 'AUTHENTICATION', amount: 0.048, currency: 'QAR' },
  { country: 'QA', category: 'SERVICE', amount: 0, currency: 'QAR' },
];

export function lookupRate(
  country: string,
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION' | 'SERVICE',
): number {
  const rate = COST_RATES.find(
    (r) => r.country === country && r.category === category,
  );
  return rate?.amount ?? 0;
}
