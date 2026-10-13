export interface SlaCheckInput {
  packageTier: 'LAUNCH' | 'GROWTH' | 'DOMINATE' | 'ADD_ON';
  totalInvoices: number;
  paidInvoices: number;
  averagePaymentDelayHours: number | null;
}

export interface SlaResult {
  compliancePercent: number;
  meetsSla: boolean;
  targetHours: number;
}

const SLA_TARGET_HOURS: Record<string, number> = {
  LAUNCH: 168,   // 7 days
  GROWTH: 120,   // 5 days
  DOMINATE: 72,  // 3 days
  ADD_ON: 168,
};

export function evaluateSla(input: SlaCheckInput): SlaResult {
  const targetHours = SLA_TARGET_HOURS[input.packageTier] ?? 168;
  const compliancePercent =
    input.totalInvoices === 0
      ? 100
      : Math.round((input.paidInvoices / input.totalInvoices) * 1000) / 10;
  const avg = input.averagePaymentDelayHours ?? 0;
  const meetsSla = avg <= targetHours;
  return { compliancePercent, meetsSla, targetHours };
}
