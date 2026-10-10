import { prisma } from '@lmms/db';
import { getCountryRule } from './country-rules';

export type SendChannel = 'WHATSAPP' | 'SMS' | 'EMAIL';
export type SendPurpose = 'MARKETING' | 'TRANSACTIONAL' | 'AUTHENTICATION' | 'SERVICE';

export interface GuardInput {
  tenantId: string;
  customerId: string;
  channel: SendChannel;
  purpose: SendPurpose;
}

export interface GuardResult {
  allowed: boolean;
  reason?: string;
  consentId?: string;
}

export async function assertConsent(input: GuardInput): Promise<GuardResult> {
  const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId } });
  if (!tenant) return { allowed: false, reason: 'tenant_not_found' };

  const dnc = await prisma.doNotContact.findFirst({
    where: { tenantId: input.tenantId, customerId: input.customerId },
  });
  if (dnc) return { allowed: false, reason: 'dnc' };

  const rule = getCountryRule(tenant.country);

  if (input.purpose === 'MARKETING') {
    const requiresExplicit =
      rule.marketingConsent === 'EXPRESS' || rule.marketingConsent === 'PRIOR';

    const consent = await prisma.consentRecord.findFirst({
      where: {
        tenantId: input.tenantId,
        customerId: input.customerId,
        channel: input.channel,
        purpose: 'MARKETING',
        status: 'OPT_IN',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { timestamp: 'desc' },
    });

    if (!consent) return { allowed: false, reason: 'no_marketing_consent' };

    if (requiresExplicit && consent.source !== 'explicit') {
      return { allowed: false, reason: 'express_consent_required' };
    }
    return { allowed: true, consentId: consent.id };
  }

  const consent = await prisma.consentRecord.findFirst({
    where: {
      tenantId: input.tenantId,
      customerId: input.customerId,
      channel: input.channel,
      status: 'OPT_IN',
    },
    orderBy: { timestamp: 'desc' },
  });

  if (!consent) return { allowed: false, reason: 'no_consent_record' };
  return { allowed: true, consentId: consent.id };
}

export async function filterEligible(
  tenantId: string,
  customerIds: string[],
  channel: SendChannel,
  purpose: SendPurpose,
): Promise<{
  eligible: Array<{ customerId: string; consentId: string }>;
  excluded: Array<{ customerId: string; reason: string }>;
}> {
  const eligible: Array<{ customerId: string; consentId: string }> = [];
  const excluded: Array<{ customerId: string; reason: string }> = [];
  for (const customerId of customerIds) {
    const r = await assertConsent({ tenantId, customerId, channel, purpose });
    if (r.allowed && r.consentId) {
      eligible.push({ customerId, consentId: r.consentId });
    } else {
      excluded.push({ customerId, reason: r.reason ?? 'unknown' });
    }
  }
  return { eligible, excluded };
}
