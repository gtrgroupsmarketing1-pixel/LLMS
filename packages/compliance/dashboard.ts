import { prisma } from '@lmms/db';

export interface ComplianceDashboard {
  consentBreakdown: Array<{ channel: string; status: string; count: number }>;
  dncCount: number;
  optOutSla: {
    eventsLast24h: number;
    propagatedWithin5Min: number;
    slaPercent: number;
  };
  retentionSchedule: Array<{
    country: string;
    dataType: string;
    retentionDays: number;
  }>;
  erasureQueue: Array<{
    id: string;
    status: string;
    dueAt: Date;
    daysRemaining: number;
  }>;
  smsSenderIds: Array<{ country: string; senderId: string; status: string }>;
}

export async function getComplianceDashboard(
  tenantId: string,
): Promise<ComplianceDashboard> {
  const consents = await prisma.consentRecord.groupBy({
    by: ['channel', 'status'],
    where: { tenantId },
    _count: { _all: true },
  });

  const dncCount = await prisma.doNotContact.count({ where: { tenantId } });

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const events = await prisma.consentOptOutEvent.findMany({
    where: { tenantId, processedAt: { gte: since24h } },
    select: { processedAt: true, propagatedAt: true },
  });
  const withinFive = events.filter(
    (e) =>
      e.propagatedAt &&
      e.propagatedAt.getTime() - e.processedAt.getTime() <= 5 * 60 * 1000,
  ).length;

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const retention = tenant
    ? await prisma.retentionPolicy.findMany({ where: { country: tenant.country } })
    : [];

  const erasures = await prisma.erasureRequest.findMany({
    where: {
      tenantId,
      status: { in: ['REQUESTED', 'IN_REVIEW', 'PROCESSING'] },
    },
    orderBy: { dueAt: 'asc' },
  });

  const senders = await prisma.smsSenderId.findMany({ where: { tenantId } });

  return {
    consentBreakdown: consents.map((c) => ({
      channel: c.channel,
      status: c.status,
      count: c._count._all,
    })),
    dncCount,
    optOutSla: {
      eventsLast24h: events.length,
      propagatedWithin5Min: withinFive,
      slaPercent: events.length
        ? Math.round((withinFive / events.length) * 100)
        : 100,
    },
    retentionSchedule: retention.map((r) => ({
      country: r.country,
      dataType: r.dataType,
      retentionDays: r.retentionDays,
    })),
    erasureQueue: erasures.map((e) => ({
      id: e.id,
      status: e.status,
      dueAt: e.dueAt,
      daysRemaining: Math.max(
        0,
        Math.floor((e.dueAt.getTime() - Date.now()) / 86_400_000),
      ),
    })),
    smsSenderIds: senders.map((s) => ({
      country: s.country,
      senderId: s.senderId,
      status: s.status,
    })),
  };
}
