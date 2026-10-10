import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';

export interface OptOutInput {
  tenantId: string;
  customerId: string;
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL';
  source: string;
  evidence?: string;
}

export async function processOptOut(
  input: OptOutInput,
): Promise<{ propagated: number; eventId: string }> {
  const now = new Date();

  const event = await prisma.consentOptOutEvent.create({
    data: {
      tenantId: input.tenantId,
      customerId: input.customerId,
      channel: input.channel,
      source: input.source,
    },
  });

  await prisma.consentRecord.create({
    data: {
      tenantId: input.tenantId,
      customerId: input.customerId,
      channel: input.channel,
      purpose: 'MARKETING',
      status: 'OPT_OUT',
      source: input.source,
      evidence: input.evidence,
    },
  });

  const otherChannels: Array<'WHATSAPP' | 'SMS' | 'EMAIL'> = (
    ['WHATSAPP', 'SMS', 'EMAIL'] as const
  ).filter((c) => c !== input.channel);

  let propagated = 1;
  for (const ch of otherChannels) {
    await prisma.consentRecord.create({
      data: {
        tenantId: input.tenantId,
        customerId: input.customerId,
        channel: ch,
        purpose: 'MARKETING',
        status: 'OPT_OUT',
        source: `propagation:${input.source}`,
      },
    });
    propagated += 1;
  }

  await prisma.endCustomer.updateMany({
    where: { id: input.customerId, tenantId: input.tenantId },
    data: { consentVerified: false, needsReview: true },
  });

  await prisma.doNotContact.upsert({
    where: {
      tenantId_customerId: {
        tenantId: input.tenantId,
        customerId: input.customerId,
      },
    },
    update: {},
    create: {
      tenantId: input.tenantId,
      customerId: input.customerId,
      reason: `opt_out:${input.channel}`,
      addedBy: 'system',
    },
  });

  await prisma.consentOptOutEvent.update({
    where: { id: event.id },
    data: { propagatedAt: new Date() },
  });

  void now;

  await logAudit(
    input.tenantId,
    'system',
    'consent.opt_out',
    `customer:${input.customerId}`,
    event.id,
  );
  return { propagated, eventId: event.id };
}
