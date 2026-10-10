import type { Kpis } from './metrics';
import type { Period } from './period';

export interface SummaryInput {
  tenantNameEn: string;
  tenantNameAr: string;
  period: Period;
  kpis: Kpis;
  mode: 'ERP_CONNECTED' | 'STANDALONE' | 'UPGRADING';
  locale: 'ar' | 'en';
}

export function buildWeeklySummary(input: SummaryInput): string {
  const { kpis: k, period, locale } = input;
  const pStart = period.start.toISOString().slice(0, 10);
  const pEnd = period.end.toISOString().slice(0, 10);

  if (locale === 'ar') {
    return [
      `📊 تقرير الأسبوع (${pStart} → ${pEnd})`,
      `• الحملات: ${k.campaignsSent}`,
      `• الرسائل المُرسَلة: ${k.messagesSent}`,
      `• نسبة التسليم: ${(k.deliveryRate * 100).toFixed(1)}%`,
      `• نسبة القراءة: ${(k.readRate * 100).toFixed(1)}%`,
      `• الإيرادات المنسوبة: ${k.attributedRevenue}`,
      `• العقود التجارية: ${k.commercialContractsSigned}`,
      `• التقييمات الجديدة: ${k.reviewsNew}`,
    ].join('\n');
  }

  return [
    `📊 Weekly Report (${pStart} → ${pEnd})`,
    `• Campaigns: ${k.campaignsSent}`,
    `• Messages sent: ${k.messagesSent}`,
    `• Delivery rate: ${(k.deliveryRate * 100).toFixed(1)}%`,
    `• Read rate: ${(k.readRate * 100).toFixed(1)}%`,
    `• Attributed revenue: ${k.attributedRevenue}`,
    `• Commercial contracts: ${k.commercialContractsSigned}`,
    `• New reviews: ${k.reviewsNew}`,
  ].join('\n');
}
