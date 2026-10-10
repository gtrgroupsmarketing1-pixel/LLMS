import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import {
  seedAutomations,
  killAutomation,
  reviveAutomation,
  isAutomationAvailable,
} from '@lmms/automations';

export async function listAutomations(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  const automations = await prisma.automation.findMany({
    where: { tenantId },
    orderBy: [{ priority: 'asc' }, { name: 'asc' }],
  });

  return automations.map((a) => {
    const availability = isAutomationAvailable(
      a.mode as 'ERP_ONLY' | 'STANDALONE_ONLY' | 'BOTH',
      tenant.mode as 'ERP_CONNECTED' | 'STANDALONE' | 'UPGRADING',
    );
    return {
      ...a,
      available: availability.available,
      lockReason: availability.reason ?? null,
    };
  });
}

export async function ensureAutomationsSeeded(tenantId: string) {
  return seedAutomations(tenantId);
}

export async function updateAutomation(opts: {
  tenantId: string;
  automationId: string;
  actorId: string;
  status?: 'ACTIVE' | 'PAUSED' | 'DRAFT';
  templateId?: string | null;
  segmentId?: string | null;
  priority?: number;
}) {
  const automation = await prisma.automation.findUnique({
    where: { id: opts.automationId },
  });
  if (!automation || automation.tenantId !== opts.tenantId) {
    throw new Error('automation_not_found');
  }

  const updated = await prisma.automation.update({
    where: { id: opts.automationId },
    data: {
      ...(opts.status !== undefined ? { status: opts.status } : {}),
      ...(opts.templateId !== undefined ? { templateId: opts.templateId } : {}),
      ...(opts.segmentId !== undefined ? { segmentId: opts.segmentId } : {}),
      ...(opts.priority !== undefined ? { priority: opts.priority } : {}),
    },
  });

  await logAudit(
    opts.tenantId,
    opts.actorId,
    'automation.update',
    `automation:${opts.automationId}`,
  );
  return updated;
}

export async function killOne(
  tenantId: string,
  automationId: string,
  actorId: string,
  reason?: string,
) {
  const r = await killAutomation(tenantId, automationId, actorId, reason);
  await logAudit(
    tenantId,
    actorId,
    'automation.kill',
    `automation:${automationId}`,
  );
  return r;
}

export async function reviveOne(
  tenantId: string,
  automationId: string,
  actorId: string,
) {
  const r = await reviveAutomation(tenantId, automationId);
  await logAudit(
    tenantId,
    actorId,
    'automation.revive',
    `automation:${automationId}`,
  );
  return r;
}

export async function listRuns(tenantId: string, automationId?: string) {
  return prisma.automationRun.findMany({
    where: {
      tenantId,
      ...(automationId ? { automationId } : {}),
    },
    orderBy: { enteredAt: 'desc' },
    take: 200,
  });
}
