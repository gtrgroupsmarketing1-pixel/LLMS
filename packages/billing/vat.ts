export interface VatSeed {
  country: string;
  rate: number;
  label: string;
  effectiveFrom: Date;
}

// GCC VAT rates (2026). Countries without VAT still get a 0% row.
export const VAT_RATES: VatSeed[] = [
  { country: 'AE', rate: 0.05,  label: 'UAE VAT 5%',         effectiveFrom: new Date(Date.UTC(2018, 0, 1)) },
  { country: 'SA', rate: 0.15,  label: 'KSA VAT 15%',        effectiveFrom: new Date(Date.UTC(2020, 6, 1)) },
  { country: 'BH', rate: 0.10,  label: 'Bahrain VAT 10%',    effectiveFrom: new Date(Date.UTC(2022, 0, 1)) },
  { country: 'OM', rate: 0.05,  label: 'Oman VAT 5%',        effectiveFrom: new Date(Date.UTC(2021, 3, 16)) },
  { country: 'KW', rate: 0,     label: 'Kuwait — no VAT',    effectiveFrom: new Date(Date.UTC(2010, 0, 1)) },
  { country: 'QA', rate: 0,     label: 'Qatar — no VAT',     effectiveFrom: new Date(Date.UTC(2010, 0, 1)) },
];

export function vatRateFor(country: string, on: Date = new Date()): number {
  const candidates = VAT_RATES
    .filter((v) => v.country === country && v.effectiveFrom <= on)
    .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime());
  return candidates[0]?.rate ?? 0;
}

export interface VatCalculation {
  rate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
}

export function computeVat(subtotal: number, rate: number): VatCalculation {
  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const vatAmount = Math.round(roundedSubtotal * rate * 100) / 100;
  const total = Math.round((roundedSubtotal + vatAmount) * 100) / 100;
  return { rate, subtotal: roundedSubtotal, vatAmount, total };
}
