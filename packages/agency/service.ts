import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import { assertTransition, type TaskStatus } from './task-states';
import { SOP_LIBRARY, getSop } from './sop-library';

type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
type TaskLinkType = 'CAMPAIGN' | 'CONTENT_CARD' | 'CLIENT' | 'PROSPECT' | 'CONTRACT' | 'AD_CAMPAIGN' | 'GENERIC';

export interface CreateTaskInput {
  tenantId?: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  linkType?: TaskLinkType;
  linkId?: string;
  assignedTo?: string;
  dueAt?: Date;
  createdBy: string;
}

export async function createTask(input: CreateTaskInput) {
  const task = await prisma.task.create({
    data: {
      tenantId: input.tenantId ?? null,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? 'NORMAL',
      linkType: input.linkType ?? 'GENERIC',
      linkId: input.linkId ?? null,
      assignedTo: input.assignedTo ?? null,
      dueAt: input.dueAt ?? null,
      createdBy: input.createdBy,
    },
  });
  await logAudit(
    input.tenantId ?? 'agency',
    input.createdBy,
    'task.create',
    `task:${task.id}`,
  );
  return task;
}

export async function listTasks(opts: {
  tenantId?: string;
  status?: string;
  assignedTo?: string;
  linkType?: string;
  linkId?: string;
}) {
  const where: Record<string, unknown> = {};
  if (opts.tenantId) where.tenantId = opts.tenantId;
  if (opts.status) where.status = opts.status;
  if (opts.assignedTo) where.assignedTo = opts.assignedTo;
  if (opts.linkType) where.linkType = opts.linkType;
  if (opts.linkId) where.linkId = opts.linkId;

  return prisma.task.findMany({
    where,
    orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
    take: 500,
  });
}

export async function transitionTask(opts: {
  actorId: string;
  taskId: string;
  to: TaskStatus;
}) {
  const task = await prisma.task.findUnique({ where: { id: opts.taskId } });
  if (!task) throw new Error('task_not_found');
  assertTransition(task.status as TaskStatus, opts.to);

  const updated = await prisma.task.update({
    where: { id: opts.taskId },
    data: {
      status: opts.to,
      ...(opts.to === 'DONE' ? { completedAt: new Date() } : {}),
    },
  });
  await logAudit(
    task.tenantId ?? 'agency',
    opts.actorId,
    'task.transition',
    `task:${opts.taskId}:${task.status}->${opts.to}`,
  );
  return updated;
}

export async function logTime(opts: {
  actorId: string;
  tenantId?: string;
  taskId?: string;
  minutes: number;
  note?: string;
  startedAt: Date;
  endedAt: Date;
}) {
  const entry = await prisma.timeEntry.create({
    data: {
      tenantId: opts.tenantId ?? null,
      taskId: opts.taskId ?? null,
      userId: opts.actorId,
      minutes: opts.minutes,
      note: opts.note ?? null,
      startedAt: opts.startedAt,
      endedAt: opts.endedAt,
    },
  });
  return entry;
}

export async function addInternalComment(opts: {
  actorId: string;
  tenantId?: string;
  entityType: string;
  entityId: string;
  body: string;
}) {
  const comment = await prisma.internalComment.create({
    data: {
      tenantId: opts.tenantId ?? null,
      authorId: opts.actorId,
      entityType: opts.entityType,
      entityId: opts.entityId,
      body: opts.body,
    },
  });
  return comment;
}

export async function listInternalComments(opts: {
  entityType: string;
  entityId: string;
}) {
  return prisma.internalComment.findMany({
    where: { entityType: opts.entityType, entityId: opts.entityId },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}

export async function seedSops(): Promise<number> {
  let count = 0;
  for (const def of SOP_LIBRARY) {
    await prisma.sopEntry.upsert({
      where: { key: def.key },
      update: {
        title: def.title,
        titleAr: def.titleAr,
        category: def.category,
        steps: def.steps as never,
      },
      create: {
        key: def.key,
        title: def.title,
        titleAr: def.titleAr,
        category: def.category,
        steps: def.steps as never,
      },
    });
    count += 1;
  }
  return count;
}

export async function recordSopCompletion(opts: {
  actorId: string;
  sopKey: string;
  tenantId?: string;
  entityType?: string;
  entityId?: string;
  notes?: string;
}) {
  const def = getSop(opts.sopKey);
  if (!def) throw new Error('sop_not_found');
  const row = await prisma.sopCompletion.create({
    data: {
      sopKey: opts.sopKey,
      tenantId: opts.tenantId ?? null,
      entityType: opts.entityType ?? null,
      entityId: opts.entityId ?? null,
      completedBy: opts.actorId,
      notes: opts.notes ?? null,
    },
  });
  return row;
}

export async function listSopCompletions(sopKey: string, limit = 100) {
  return prisma.sopCompletion.findMany({
    where: { sopKey },
    orderBy: { completedAt: 'desc' },
    take: limit,
  });
}

export async function listSops() {
  return prisma.sopEntry.findMany({
    where: { active: true },
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  });
}

export async function bulkApprove(opts: {
  actorId: string;
  campaignIds: string[];
}) {
  if (opts.campaignIds.length > 50) {
    throw new Error('bulk_limit_exceeded');
  }
  const results = await prisma.$transaction(
    opts.campaignIds.map((id) =>
      prisma.campaign.update({
        where: { id },
        data: { status: 'APPROVED' },
      }),
    ),
  );
  for (const c of results) {
    await logAudit(
      c.tenantId,
      opts.actorId,
      'campaign.bulk_approve',
      `campaign:${c.id}`,
    );
  }
  return { approved: results.length };
}
