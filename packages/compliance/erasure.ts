import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import { getCountryRule } from './country-rules';

export interface ErasureInput {
  tenantId: string;
  customerId: string;
  scope: 'PII_ONLY' | 'FULL';
  actorId: string;
  notes?: string;
}

export async function createErasureRequest(input: ErasureInput) {
  const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId } });
  if (!tenant) throw new Error('tenant_not_found');
  const rule = getCountryRule(tenant.country);

  const dueAt = new Date(Date.now() + rule.erasureWindowDays * 86_400_000);
  const request = await prisma.erasureRequest.create({
    data: {
      tenantId: input.tenantId,
      customerId: input.customerId,
      scope: input.scope,
      status: 'REQUESTED',
      dueAt,
      notes: input.notes,
    },
  });

  await logAudit(
    input.tenantId,
    input.actorId,
    'erasure.request',
    `customer:${input.customerId}`,
  );
  return request;
}

export async function processErasure(
  tenantId: string,
  erasureId: string,
  actorId: string,
): Promise<{ piiFieldsCleared: number; auditPreserved: boolean }> {
  const req = await prisma.erasureRequest.findUnique({ where: { id: erasureId } });
  if (!req || req.tenantId !== tenantId) throw new Error('erasure_not_found');
  if (req.status === 'COMPLETED') {
    return { piiFieldsCleared: 0, auditPreserved: true };
  }

  await prisma.erasureRequest.update({
    where: { id: erasureId },
    data: { status: 'PROCESSING' },
  });

  const result = await prisma.endCustomer.updateMany({
    where: { id: req.customerId, tenantId },
    data: {
      phone: `erased_${req.customerId.slice(0, 8)}`,
      email: null,
      name: null,
      zone: null,
      consentVerified: false,
      needsReview: false,
    },
  });

  await prisma.consentRecord.deleteMany({
    where: { tenantId, customerId: req.customerId },
  });

  await logAudit(
    tenantId,
    actorId,
    'erasure.complete',
    `customer:${req.customerId}`,
  );

  await prisma.erasureRequest.update({
    where: { id: erasureId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      auditRef: `audit:erasure:${erasureId}`,
    },
  });

  return { piiFieldsCleared: result.count, auditPreserved: true };
}

export async function listErasureQueue(tenantId: string) {
  return prisma.erasureRequest.findMany({
    where: {
      tenantId,
      status: { in: ['REQUESTED', 'IN_REVIEW', 'PROCESSING'] },
    },
    orderBy: { dueAt: 'asc' },
  });
}
