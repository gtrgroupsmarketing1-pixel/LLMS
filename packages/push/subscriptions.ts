import { prisma } from '@lmms/db';

export interface RegisterSubscriptionInput {
  userId: string;
  tenantId?: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}

export async function registerSubscription(input: RegisterSubscriptionInput) {
  const existing = await prisma.pushSubscription.findUnique({
    where: { endpoint: input.endpoint },
  });
  if (existing) {
    return prisma.pushSubscription.update({
      where: { id: existing.id },
      data: {
        userId: input.userId,
        tenantId: input.tenantId ?? null,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: input.userAgent ?? null,
        status: 'ACTIVE',
        lastUsedAt: new Date(),
      },
    });
  }
  return prisma.pushSubscription.create({
    data: {
      userId: input.userId,
      tenantId: input.tenantId ?? null,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      userAgent: input.userAgent ?? null,
    },
  });
}

export async function revokeSubscription(endpoint: string) {
  const sub = await prisma.pushSubscription.findUnique({ where: { endpoint } });
  if (!sub) return { revoked: false };
  await prisma.pushSubscription.update({
    where: { id: sub.id },
    data: { status: 'REVOKED' },
  });
  return { revoked: true };
}

export async function listActiveForUser(userId: string) {
  return prisma.pushSubscription.findMany({
    where: { userId, status: 'ACTIVE' },
  });
}
