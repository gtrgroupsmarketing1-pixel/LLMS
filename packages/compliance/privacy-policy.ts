import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';

export async function publishPrivacyPolicy(opts: {
  version: string;
  contentEn: string;
  contentAr: string;
}) {
  const policy = await prisma.privacyPolicy.create({
    data: {
      version: opts.version,
      contentEn: opts.contentEn,
      contentAr: opts.contentAr,
    },
  });
  return policy;
}

export async function getLatestPrivacyPolicy() {
  return prisma.privacyPolicy.findFirst({
    orderBy: { publishedAt: 'desc' },
  });
}

export async function recordPrivacyPolicyAcceptance(opts: {
  tenantId: string;
  actorId: string;
  policyId: string;
  ipAddress?: string;
}) {
  const policy = await prisma.privacyPolicy.findUnique({
    where: { id: opts.policyId },
  });
  if (!policy) throw new Error('policy_not_found');

  const acceptance = await prisma.privacyPolicyAcceptance.upsert({
    where: {
      tenantId_privacyPolicyId: {
        tenantId: opts.tenantId,
        privacyPolicyId: policy.id,
      },
    },
    update: {
      acceptedAt: new Date(),
      ipAddress: opts.ipAddress ?? null,
    },
    create: {
      tenantId: opts.tenantId,
      privacyPolicyId: policy.id,
      acceptedBy: opts.actorId,
      ipAddress: opts.ipAddress ?? null,
    },
  });

  await prisma.tenant.update({
    where: { id: opts.tenantId },
    data: { privacyPolicyAcceptedAt: new Date() },
  });

  await logAudit(opts.tenantId, opts.actorId, 'privacy_policy.accept', `policy_acceptance:${acceptance.id}`);
  return acceptance;
}
