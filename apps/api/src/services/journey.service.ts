import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import {
  assertGraphValid,
  validateGraph,
  simulateJourney,
} from '@lmms/journey-builder';

export async function listJourneys(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  return prisma.journey.findMany({
    where: { tenantId },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function createJourney(opts: {
  tenantId: string;
  actorId: string;
  name: string;
  nameAr?: string;
  definition: unknown;
  priority?: number;
  frequencyCapHours?: number;
}) {
  assertGraphValid(opts.definition);

  const journey = await prisma.journey.create({
    data: {
      tenantId: opts.tenantId,
      name: opts.name,
      nameAr: opts.nameAr ?? null,
      status: 'DRAFT',
      priority: opts.priority ?? 100,
      frequencyCapHours: opts.frequencyCapHours ?? 24,
      definition: opts.definition as never,
      createdBy: opts.actorId,
    },
  });

  await prisma.journeyVersion.create({
    data: {
      journeyId: journey.id,
      tenantId: opts.tenantId,
      version: 1,
      snapshot: opts.definition as never,
      changedBy: opts.actorId,
      changeNote: 'created',
    },
  });

  await logAudit(opts.tenantId, opts.actorId, 'journey.create', `journey:${journey.id}`);
  return journey;
}

export async function getJourney(tenantId: string, journeyId: string) {
  const journey = await prisma.journey.findUnique({ where: { id: journeyId } });
  if (!journey || journey.tenantId !== tenantId) return null;
  const versions = await prisma.journeyVersion.findMany({
    where: { journeyId },
    orderBy: { version: 'desc' },
  });
  const killed = await prisma.journeyKillSwitch.findUnique({
    where: { tenantId_journeyId: { tenantId, journeyId } },
  });
  return { ...journey, versions, killed: !!killed };
}

export async function updateJourney(opts: {
  tenantId: string;
  actorId: string;
  journeyId: string;
  patch: Partial<{
    name: string;
    nameAr: string | null;
    definition: unknown;
    priority: number;
    frequencyCapHours: number;
  }>;
  changeNote?: string;
}) {
  const existing = await prisma.journey.findUnique({ where: { id: opts.journeyId } });
  if (!existing || existing.tenantId !== opts.tenantId) {
    throw new Error('journey_not_found');
  }
  if (existing.status === 'ARCHIVED') throw new Error('journey_archived');

  if (opts.patch.definition !== undefined) {
    assertGraphValid(opts.patch.definition);
  }

  const nextVersion = existing.currentVersion + 1;
  const updated = await prisma.journey.update({
    where: { id: opts.journeyId },
    data: {
      ...(opts.patch.name !== undefined ? { name: opts.patch.name } : {}),
      ...(opts.patch.nameAr !== undefined ? { nameAr: opts.patch.nameAr } : {}),
      ...(opts.patch.definition !== undefined
        ? { definition: opts.patch.definition as never }
        : {}),
      ...(opts.patch.priority !== undefined ? { priority: opts.patch.priority } : {}),
      ...(opts.patch.frequencyCapHours !== undefined
        ? { frequencyCapHours: opts.patch.frequencyCapHours }
        : {}),
      currentVersion: nextVersion,
    },
  });

  if (opts.patch.definition !== undefined) {
    await prisma.journeyVersion.create({
      data: {
        journeyId: updated.id,
        tenantId: opts.tenantId,
        version: nextVersion,
        snapshot: opts.patch.definition as never,
        changedBy: opts.actorId,
        changeNote: opts.changeNote ?? 'updated',
      },
    });
  }

  await logAudit(opts.tenantId, opts.actorId, 'journey.update', `journey:${updated.id}`);
  return updated;
}

export async function publishJourney(
  tenantId: string,
  journeyId: string,
  actorId: string,
) {
  const journey = await prisma.journey.findUnique({ where: { id: journeyId } });
  if (!journey || journey.tenantId !== tenantId) throw new Error('journey_not_found');
  if (journey.status === 'ACTIVE') return journey;

  assertGraphValid(journey.definition);

  const updated = await prisma.journey.update({
    where: { id: journeyId },
    data: { status: 'ACTIVE' },
  });
  await logAudit(tenantId, actorId, 'journey.publish', `journey:${journeyId}`);
  return updated;
}

export async function pauseJourney(
  tenantId: string,
  journeyId: string,
  actorId: string,
) {
  const updated = await prisma.journey.update({
    where: { id: journeyId },
    data: { status: 'PAUSED' },
  });
  await logAudit(tenantId, actorId, 'journey.pause', `journey:${journeyId}`);
  return updated;
}

export async function archiveJourney(
  tenantId: string,
  journeyId: string,
  actorId: string,
) {
  const updated = await prisma.journey.update({
    where: { id: journeyId },
    data: { status: 'ARCHIVED' },
  });
  await logAudit(tenantId, actorId, 'journey.archive', `journey:${journeyId}`);
  return updated;
}

export async function killJourney(
  tenantId: string,
  journeyId: string,
  actorId: string,
  reason?: string,
) {
  await prisma.journeyKillSwitch.upsert({
    where: { tenantId_journeyId: { tenantId, journeyId } },
    update: { killedAt: new Date(), killedBy: actorId, reason },
    create: { tenantId, journeyId, killedBy: actorId, reason },
  });
  await prisma.journey.update({
    where: { id: journeyId },
    data: { status: 'PAUSED' },
  });
  await logAudit(tenantId, actorId, 'journey.kill', `journey:${journeyId}`);
  return { killed: true };
}

export async function reviveJourney(
  tenantId: string,
  journeyId: string,
  actorId: string,
) {
  await prisma.journeyKillSwitch.deleteMany({
    where: { tenantId, journeyId },
  });
  await logAudit(tenantId, actorId, 'journey.revive', `journey:${journeyId}`);
  return { revived: true };
}

export async function simulate(tenantId: string, definition: unknown) {
  return simulateJourney({ tenantId, definition });
}

export async function listRuns(
  tenantId: string,
  journeyId?: string,
  limit = 200,
) {
  return prisma.journeyRun.findMany({
    where: {
      tenantId,
      ...(journeyId ? { journeyId } : {}),
    },
    orderBy: { enteredAt: 'desc' },
    take: limit,
  });
}

export async function listRunsForJourney(
  tenantId: string,
  journeyId: string,
  limit = 200,
) {
  const journey = await prisma.journey.findUnique({ where: { id: journeyId } });
  if (!journey || journey.tenantId !== tenantId) throw new Error('journey_not_found');
  return prisma.journeyRun.findMany({
    where: { tenantId, journeyId },
    orderBy: { enteredAt: 'desc' },
    take: limit,
  });
}
