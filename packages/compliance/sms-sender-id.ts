import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import { getCountryRule } from './country-rules';

export async function registerSmsSenderId(opts: {
  tenantId: string;
  country: string;
  senderId: string;
  actorId: string;
}) {
  const rule = getCountryRule(opts.country);
  if (!rule.smsSenderIdRequired) {
    throw new Error('sender_id_not_required');
  }
  const record = await prisma.smsSenderId.upsert({
    where: {
      tenantId_country_senderId: {
        tenantId: opts.tenantId,
        country: opts.country,
        senderId: opts.senderId,
      },
    },
    update: {},
    create: {
      tenantId: opts.tenantId,
      country: opts.country,
      senderId: opts.senderId,
      regulator: rule.regulator,
      status: 'PENDING',
    },
  });
  await logAudit(
    opts.tenantId,
    opts.actorId,
    'sms.sender_id.submit',
    `sender:${opts.senderId}`,
  );
  return record;
}

export async function approveSmsSenderId(
  tenantId: string,
  recordId: string,
  actorId: string,
) {
  const updated = await prisma.smsSenderId.update({
    where: { id: recordId },
    data: { status: 'APPROVED', approvedAt: new Date() },
  });
  await logAudit(
    tenantId,
    actorId,
    'sms.sender_id.approve',
    `sender:${updated.senderId}`,
  );
  return updated;
}

export async function listSmsSenderIds(tenantId: string) {
  return prisma.smsSenderId.findMany({ where: { tenantId } });
}
