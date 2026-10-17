import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import { createAdapter, type PushPayload } from './adapter';

type PushNotificationKind =
  | 'APPROVAL_READY'
  | 'APPROVAL_DECIDED'
  | 'REVIEW_ESCALATION'
  | 'REPORT_READY'
  | 'INVOICE_SENT'
  | 'INVOICE_PAID'
  | 'MIGRATION_READY'
  | 'SYSTEM_ALERT';

export interface DispatchInput {
  userId: string;
  tenantId?: string;
  kind: PushNotificationKind;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface DispatchResult {
  queued: number;
  sent: number;
  failed: number;
}

/**
 * Records a notification for every active subscription belonging to the
 * user, then attempts delivery via the adapter.
 */
export async function dispatchPush(input: DispatchInput): Promise<DispatchResult> {
  const subs = await prisma.pushSubscription.findMany({
    where: { userId: input.userId, status: 'ACTIVE' },
  });

  if (subs.length === 0) {
    // Record the intent even without subscriptions so audit shows it.
    await prisma.pushNotification.create({
      data: {
        userId: input.userId,
        tenantId: input.tenantId ?? null,
        kind: input.kind,
        title: input.title,
        body: input.body,
        data: (input.data ?? null) as never,
        status: 'FAILED',
        failureReason: 'no_active_subscription',
        sentAt: new Date(),
      },
    });
    return { queued: 1, sent: 0, failed: 1 };
  }

  const adapter = createAdapter();
  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    const notification = await prisma.pushNotification.create({
      data: {
        userId: input.userId,
        tenantId: input.tenantId ?? null,
        kind: input.kind,
        title: input.title,
        body: input.body,
        data: (input.data ?? null) as never,
        status: 'QUEUED',
      },
    });

    const payload: PushPayload = {
      title: input.title,
      body: input.body,
      data: input.data,
    };

    const result = await adapter.send(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      payload,
    );

    if (result.ok) {
      await prisma.pushNotification.update({
        where: { id: notification.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
      await prisma.pushSubscription.update({
        where: { id: sub.id },
        data: { lastUsedAt: new Date() },
      });
      sent += 1;
    } else {
      await prisma.pushNotification.update({
        where: { id: notification.id },
        data: {
          status: 'FAILED',
          failureReason: result.reason ?? 'unknown',
          sentAt: new Date(),
        },
      });
      failed += 1;
    }
  }

  if (input.tenantId) {
    await logAudit(
      input.tenantId,
      'push',
      'push.dispatch',
      `kind:${input.kind}`,
    );
  }

  return { queued: subs.length, sent, failed };
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const existing = await prisma.pushNotification.findUnique({
    where: { id: notificationId },
  });
  if (!existing || existing.userId !== userId) throw new Error('notification_not_found');
  return prisma.pushNotification.update({
    where: { id: notificationId },
    data: { readAt: new Date(), status: 'READ' },
  });
}

export async function listForUser(userId: string, limit = 50) {
  return prisma.pushNotification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function unreadCount(userId: string): Promise<number> {
  return prisma.pushNotification.count({
    where: { userId, readAt: null },
  });
}
