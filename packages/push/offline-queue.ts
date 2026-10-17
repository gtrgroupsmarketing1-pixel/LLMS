import { prisma } from '@lmms/db';

export interface EnqueueInput {
  userId: string;
  tenantId?: string;
  clientId: string;
  action: string;
  payload: Record<string, unknown>;
}

export async function enqueueOfflineAction(input: EnqueueInput) {
  const existing = await prisma.offlineAction.findUnique({
    where: { clientId: input.clientId },
  });
  if (existing) return existing;

  return prisma.offlineAction.create({
    data: {
      userId: input.userId,
      tenantId: input.tenantId ?? null,
      clientId: input.clientId,
      action: input.action,
      payload: input.payload as never,
      status: 'PENDING',
    },
  });
}

export async function listPending(userId: string) {
  return prisma.offlineAction.findMany({
    where: { userId, status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });
}

export async function markSynced(clientId: string, success: boolean, reason?: string) {
  const action = await prisma.offlineAction.findUnique({ where: { clientId } });
  if (!action) return null;
  return prisma.offlineAction.update({
    where: { id: action.id },
    data: {
      status: success ? 'SYNCED' : 'FAILED',
      syncedAt: new Date(),
      failureReason: success ? null : reason ?? 'unknown',
    },
  });
}
