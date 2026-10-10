import { prisma } from '@lmms/db';

export interface EligibleCustomer {
  id: string;
  phone: string;
  language: string;
  name: string | null;
  zone: string | null;
  consentId: string;
}

export interface EligibilityResult {
  eligible: EligibleCustomer[];
  excluded: Array<{ customerId: string; reason: string }>;
  campaignBlocked: boolean;
  blockReason?: string;
}

export async function checkEligibility(
  tenantId: string,
  customerIds: string[],
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL',
): Promise<EligibilityResult> {
  const excluded: EligibilityResult['excluded'] = [];

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return { eligible: [], excluded: [], campaignBlocked: true, blockReason: 'tenant_not_found' };

  if (tenant.mode === 'ERP_CONNECTED') {
    const ds = await prisma.dataSource.findFirst({
      where: { tenantId, type: 'ERP' },
    });
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    if (
      !ds ||
      ds.status === 'FAILED' ||
      ds.status === 'STALE' ||
      !ds.lastSyncAt ||
      ds.lastSyncAt < twoHoursAgo
    ) {
      return {
        eligible: [],
        excluded: [],
        campaignBlocked: true,
        blockReason: 'erp_data_stale',
      };
    }
  }

  const customers = await prisma.endCustomer.findMany({
    where: { tenantId, id: { in: customerIds } },
  });

  const consentRecords = await prisma.consentRecord.findMany({
    where: {
      tenantId,
      customerId: { in: customerIds },
      channel,
      status: 'OPT_IN',
    },
  });
  const consentByCustomer = new Map(consentRecords.map((c) => [c.customerId, c]));

  const dncRows = await prisma.doNotContact.findMany({
    where: { tenantId, customerId: { in: customerIds } },
  });
  const dncIds = new Set(dncRows.map((c) => c.customerId));

  const eligible: EligibleCustomer[] = [];
  for (const c of customers) {
    if (dncIds.has(c.id)) {
      excluded.push({ customerId: c.id, reason: 'do_not_contact' });
      continue;
    }
    if (!c.consentVerified && c.needsReview) {
      excluded.push({ customerId: c.id, reason: 'consent_unverified' });
      continue;
    }
    const consent = consentByCustomer.get(c.id);
    if (!consent) {
      excluded.push({ customerId: c.id, reason: 'no_consent_record' });
      continue;
    }
    eligible.push({
      id: c.id,
      phone: c.phone,
      language: c.language,
      name: c.name,
      zone: c.zone,
      consentId: consent.id,
    });
  }

  return { eligible, excluded, campaignBlocked: false };
}
