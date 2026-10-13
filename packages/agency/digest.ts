import { prisma } from '@lmms/db';

export interface DigestSection {
  key: string;
  label: string;
  labelAr: string;
  count: number;
  items: Array<{ id: string; label: string; meta?: string }>;
}

export interface Digest {
  generatedAt: string;
  sections: DigestSection[];
}

export async function buildDailyDigest(): Promise<Digest> {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const now = new Date();

  const [failedSyncs, pendingApprovals, escalatedReviews, blockedTasks, overdueInvoices] =
    await Promise.all([
      prisma.dataSource.findMany({
        where: { status: { in: ['FAILED', 'STALE'] } },
        take: 25,
      }),
      prisma.campaign.findMany({
        where: { status: 'PENDING_APPROVAL' },
        take: 25,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.review.findMany({
        where: { escalated: true, responded: false },
        take: 25,
        orderBy: { escalatedAt: 'asc' },
      }),
      prisma.task.findMany({
        where: { status: 'BLOCKED' },
        take: 25,
        orderBy: { updatedAt: 'asc' },
      }),
      prisma.invoice.findMany({
        where: { status: { in: ['SENT', 'OVERDUE'] }, dueDate: { lt: now } },
        take: 25,
        orderBy: { dueDate: 'asc' },
      }),
    ]);

  void twoHoursAgo;

  return {
    generatedAt: new Date().toISOString(),
    sections: [
      {
        key: 'failed_syncs',
        label: 'Failed / stale data sources',
        labelAr: 'مصادر بيانات فاشلة أو قديمة',
        count: failedSyncs.length,
        items: failedSyncs.map((d) => ({
          id: d.id,
          label: `${d.type} — ${d.status}`,
          meta: d.lastSyncAt?.toISOString() ?? undefined,
        })),
      },
      {
        key: 'pending_approvals',
        label: 'Campaigns awaiting approval',
        labelAr: 'حملات بانتظار الموافقة',
        count: pendingApprovals.length,
        items: pendingApprovals.map((c) => ({
          id: c.id,
          label: c.name,
          meta: c.createdAt.toISOString(),
        })),
      },
      {
        key: 'escalated_reviews',
        label: 'Escalated reviews',
        labelAr: 'تقييمات مصعّدة',
        count: escalatedReviews.length,
        items: escalatedReviews.map((r) => ({
          id: r.id,
          label: `${r.platform} — ${r.rating}★`,
          meta: r.escalatedAt?.toISOString() ?? undefined,
        })),
      },
      {
        key: 'blocked_tasks',
        label: 'Blocked tasks',
        labelAr: 'مهام معطلة',
        count: blockedTasks.length,
        items: blockedTasks.map((t) => ({
          id: t.id,
          label: t.title,
          meta: t.assignedTo ?? undefined,
        })),
      },
      {
        key: 'overdue_invoices',
        label: 'Overdue invoices',
        labelAr: 'فواتير متأخرة',
        count: overdueInvoices.length,
        items: overdueInvoices.map((i) => ({
          id: i.id,
          label: `${i.number} — ${i.currency} ${i.total}`,
          meta: i.dueDate.toISOString(),
        })),
      },
    ],
  };
}
