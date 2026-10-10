import { prisma } from '@lmms/db';
import { getCountryRule } from './country-rules';

export interface RetentionRunResult {
  tenantId: string;
  country: string;
  deletedConsent: number;
  deletedMarketing: number;
  deletedTransaction: number;
  runAt: Date;
}

export async function applyRetentionPolicy(
  tenantId: string,
): Promise<RetentionRunResult> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant_not_found');
  const rule = getCountryRule(tenant.country);

  const now = Date.now();
  const consentCutoff = new Date(now - rule.retentionDays.consent * 86_400_000);
  const marketingCutoff = new Date(now - rule.retentionDays.marketing * 86_400_000);
  const transactionCutoff = new Date(
    now - rule.retentionDays.transaction * 86_400_000,
  );

  const consentDel = await prisma.consentRecord.deleteMany({
    where: {
      tenantId,
      timestamp: { lt: consentCutoff },
      status: { not: 'OPT_IN' },
    },
  });

  const marketingDel = await prisma.message.deleteMany({
    where: { tenantId, sentAt: { lt: marketingCutoff } },
  });

  const transactionDel = await prisma.order.deleteMany({
    where: { tenantId, orderDate: { lt: transactionCutoff } },
  });

  return {
    tenantId,
    country: tenant.country,
    deletedConsent: consentDel.count,
    deletedMarketing: marketingDel.count,
    deletedTransaction: transactionDel.count,
    runAt: new Date(),
  };
}

export async function seedRetentionPolicies() {
  const { COUNTRY_RULES } = await import('./country-rules');
  for (const rule of COUNTRY_RULES) {
    const entries: Array<{ dataType: string; days: number; basis: string }> = [
      { dataType: 'consent', days: rule.retentionDays.consent, basis: 'CONSENT' },
      { dataType: 'marketing', days: rule.retentionDays.marketing, basis: 'CONSENT' },
      { dataType: 'audit', days: rule.retentionDays.audit, basis: 'LEGAL_OBLIGATION' },
      { dataType: 'transaction', days: rule.retentionDays.transaction, basis: 'CONTRACT' },
    ];
    for (const e of entries) {
      await prisma.retentionPolicy.upsert({
        where: { country_dataType: { country: rule.country, dataType: e.dataType } },
        update: { retentionDays: e.days, basis: e.basis },
        create: {
          country: rule.country,
          dataType: e.dataType,
          retentionDays: e.days,
          basis: e.basis,
        },
      });
    }
  }
}
