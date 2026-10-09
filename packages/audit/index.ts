import crypto from 'node:crypto';
import { prisma } from '@lmms/db';

interface AuditEntryInput {
  tenantId: string;
  actor: string;
  action: string;
  entity: string;
  consentRef?: string;
}

interface AuditHashInput extends AuditEntryInput {
  timestamp: Date;
  prevHash?: string | null;
}

function computeHash(input: AuditHashInput): string {
  const payload = JSON.stringify({
    tenantId: input.tenantId,
    actor: input.actor,
    action: input.action,
    entity: input.entity,
    timestamp: input.timestamp.toISOString(),
    consentRef: input.consentRef ?? null,
    prevHash: input.prevHash ?? null,
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export async function logAudit(
  tenantId: string,
  actor: string,
  action: string,
  entity: string,
  consentRef?: string,
) {
  const last = await prisma.auditLog.findFirst({
    where: { tenantId },
    orderBy: { timestamp: 'desc' },
    select: { hash: true },
  });
  const timestamp = new Date();
  const hash = computeHash({
    tenantId,
    actor,
    action,
    entity,
    consentRef,
    timestamp,
    prevHash: last?.hash ?? null,
  });
  return prisma.auditLog.create({
    data: {
      tenantId,
      actor,
      action,
      entity,
      timestamp,
      consentRef: consentRef ?? null,
      hash,
      prevHash: last?.hash ?? null,
    },
  });
}

export async function verifyAuditChain(
  tenantId: string,
  limit = 1000,
): Promise<{ valid: boolean; brokenAt?: string }> {
  const entries = await prisma.auditLog.findMany({
    where: { tenantId },
    orderBy: { timestamp: 'asc' },
    take: limit,
  });
  let prev: string | null = null;
  for (const e of entries) {
    if (e.prevHash !== prev) return { valid: false, brokenAt: e.id };
    const recomputed = computeHash({
      tenantId: e.tenantId,
      actor: e.actor,
      action: e.action,
      entity: e.entity,
      consentRef: e.consentRef ?? undefined,
      timestamp: e.timestamp,
      prevHash: e.prevHash,
    });
    if (recomputed !== e.hash) return { valid: false, brokenAt: e.id };
    prev = e.hash;
  }
  return { valid: true };
}

export async function exportAuditLog(tenantId: string, since?: Date, until?: Date) {
  return prisma.auditLog.findMany({
    where: {
      tenantId,
      ...(since || until
        ? { timestamp: { gte: since, lte: until } }
        : {}),
    },
    orderBy: { timestamp: 'asc' },
  });
}
