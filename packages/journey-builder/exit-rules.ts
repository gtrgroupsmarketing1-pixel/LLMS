import { prisma } from '@lmms/db';
import type { ExitRule } from './schema';

export interface ExitCheckInput {
  tenantId: string;
  customerId: string;
  rules: ExitRule[];
}

export interface ExitCheckResult {
  shouldExit: boolean;
  reason?: string;
}

export async function checkExitRules(
  input: ExitCheckInput,
): Promise<ExitCheckResult> {
  for (const rule of input.rules) {
    switch (rule.type) {
      case 'CUSTOMER_OPTED_OUT': {
        const rec = await prisma.consentRecord.findFirst({
          where: {
            tenantId: input.tenantId,
            customerId: input.customerId,
            status: 'OPT_OUT',
          },
        });
        if (rec) return { shouldExit: true, reason: 'customer_opted_out' };
        break;
      }
      case 'CUSTOMER_ON_DNC': {
        const dnc = await prisma.doNotContact.findFirst({
          where: { tenantId: input.tenantId, customerId: input.customerId },
        });
        if (dnc) return { shouldExit: true, reason: 'customer_on_dnc' };
        break;
      }
      case 'ERP_DATA_STALE': {
        const tenant = await prisma.tenant.findUnique({
          where: { id: input.tenantId },
        });
        if (tenant?.mode === 'ERP_CONNECTED') {
          const ds = await prisma.dataSource.findFirst({
            where: { tenantId: input.tenantId, type: 'ERP' },
          });
          const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
          if (
            !ds ||
            ds.status === 'FAILED' ||
            ds.status === 'STALE' ||
            !ds.lastSyncAt ||
            ds.lastSyncAt < twoHoursAgo
          ) {
            return { shouldExit: true, reason: 'erp_data_stale' };
          }
        }
        break;
      }
      case 'CUSTOMER_REPLIED': {
        const recentReply = await prisma.message.findFirst({
          where: {
            tenantId: input.tenantId,
            customerId: input.customerId,
            status: 'REPLIED',
            sentAt: { gte: new Date(Date.now() - 7 * 86_400_000) },
          },
        });
        if (recentReply) return { shouldExit: true, reason: 'customer_replied' };
        break;
      }
      case 'FREQUENCY_CAP':
        // Handled by the runner via FrequencyLedger.
        break;
    }
  }
  return { shouldExit: false };
}
