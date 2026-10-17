import { prisma } from '@lmms/db';

export interface VisitInput {
  tenantId: string;
  websiteId: string;
  pageId: string;
  path: string;
  referrer?: string;
  country?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export async function trackVisit(input: VisitInput) {
  return prisma.websiteVisit.create({
    data: {
      tenantId: input.tenantId,
      websiteId: input.websiteId,
      pageId: input.pageId,
      path: input.path,
      referrer: input.referrer ?? null,
      country: input.country ?? null,
      utmSource: input.utmSource ?? null,
      utmMedium: input.utmMedium ?? null,
      utmCampaign: input.utmCampaign ?? null,
    },
  });
}

export async function visitStats(tenantId: string, since: Date) {
  const rows = await prisma.websiteVisit.groupBy({
    by: ['utmSource'],
    where: { tenantId, createdAt: { gte: since } },
    _count: { _all: true },
  });
  return rows.map((r) => ({
    source: r.utmSource ?? 'direct',
    count: r._count._all,
  }));
}
