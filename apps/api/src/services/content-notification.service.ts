import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';

export async function recordNotification(opts: {
  tenantId: string;
  cardId: string;
  kind: 'APPROVAL_REQUEST' | 'APPROVAL_REMINDER' | 'REJECTION_NOTICE' | 'APPROVAL_CONFIRMED';
  channel?: string;
  sentTo?: string;
  meta?: Record<string, unknown>;
}) {
  return prisma.contentNotification.create({
    data: {
      tenantId: opts.tenantId,
      cardId: opts.cardId,
      kind: opts.kind,
      channel: opts.channel ?? 'WHATSAPP',
      sentTo: opts.sentTo ?? null,
      meta: (opts.meta ?? null) as never,
    },
  });
}

export async function listNotifications(tenantId: string, cardId: string) {
  return prisma.contentNotification.findMany({
    where: { tenantId, cardId },
    orderBy: { sentAt: 'desc' },
  });
}

export async function rejectionAnalytics(tenantId: string) {
  const rejected = await prisma.contentCard.findMany({
    where: { tenantId, status: 'REJECTED', rejectionReason: { not: null } },
    select: { rejectionReason: true },
  });

  const counts = new Map<string, number>();
  for (const r of rejected) {
    const key = (r.rejectionReason ?? '').trim() || 'unspecified';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const total = rejected.length;
  const buckets = [...counts.entries()]
    .map(([reason, count]) => ({
      reason,
      count,
      percent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return { total, buckets };
}

export async function approvalQueue(tenantId: string) {
  return prisma.contentCard.findMany({
    where: {
      tenantId,
      status: { in: ['INTERNAL_REVIEW', 'CLIENT_REVIEW'] },
    },
    orderBy: { updatedAt: 'asc' },
  });
}

export async function sendApprovalRequest(opts: {
  tenantId: string;
  actorId: string;
  cardId: string;
  sentTo: string;
  approvalUrl: string;
}) {
  const n = await recordNotification({
    tenantId: opts.tenantId,
    cardId: opts.cardId,
    kind: 'APPROVAL_REQUEST',
    sentTo: opts.sentTo,
    meta: { approvalUrl: opts.approvalUrl },
  });
  await logAudit(opts.tenantId, opts.actorId, 'content.notify.request', `card:${opts.cardId}`);
  return n;
}
