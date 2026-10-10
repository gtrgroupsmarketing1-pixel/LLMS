import { prisma } from '@lmms/db';
import {
  collectRawMetrics,
  computeKpis,
  applyModeFilter,
  generateMonthlyReport,
  generateWeeklySummary,
  lastCompletedMonth,
  type Period,
} from '@lmms/reporting';

export interface DashboardKpisResponse {
  tenant: {
    id: string;
    nameEn: string;
    nameAr: string;
    mode: string;
    country: string;
  };
  period: { start: string; end: string };
  kpis: Record<string, unknown>;
  freshness: {
    lastSyncAt: string | null;
    fresh: boolean;
    sources: Array<{
      id: string;
      type: string;
      status: string;
      lastSyncAt: string | null;
      fresh: boolean;
    }>;
  };
}

export async function getClientDashboard(
  tenantId: string,
  period?: Period,
): Promise<DashboardKpisResponse> {
  const p = period ?? lastCompletedMonth();
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  const raw = await collectRawMetrics(tenantId, p);
  const kpis = computeKpis(raw);
  const filtered = applyModeFilter(
    kpis,
    tenant.mode as 'ERP_CONNECTED' | 'STANDALONE' | 'UPGRADING',
  );

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const sources = await prisma.dataSource.findMany({ where: { tenantId } });
  const latest = sources
    .filter((s) => s.lastSyncAt)
    .sort((a, b) => b.lastSyncAt!.getTime() - a.lastSyncAt!.getTime())[0];

  return {
    tenant: {
      id: tenant.id,
      nameEn: tenant.nameEn,
      nameAr: tenant.nameAr,
      mode: tenant.mode,
      country: tenant.country,
    },
    period: { start: p.start.toISOString(), end: p.end.toISOString() },
    kpis: filtered as Record<string, unknown>,
    freshness: {
      lastSyncAt: latest?.lastSyncAt?.toISOString() ?? null,
      fresh: !!(latest?.lastSyncAt && latest.lastSyncAt > twoHoursAgo),
      sources: sources.map((s) => ({
        id: s.id,
        type: s.type,
        status: s.status,
        lastSyncAt: s.lastSyncAt?.toISOString() ?? null,
        fresh: !!(s.lastSyncAt && s.lastSyncAt > twoHoursAgo),
      })),
    },
  };
}

export async function getAgencyOverview() {
  const tenants = await prisma.tenant.findMany({ where: { status: 'ACTIVE' } });

  const byMode: Record<string, number> = {};
  for (const t of tenants) byMode[t.mode] = (byMode[t.mode] ?? 0) + 1;

  const pendingApprovals = await prisma.campaign.count({
    where: { status: 'PENDING_APPROVAL' },
  });

  const failedSyncs = await prisma.dataSource.count({
    where: { status: { in: ['FAILED', 'STALE'] } },
  });

  const churnRisk = tenants.filter((t) => t.churnRisk).length;
  const upgradeReady = tenants.filter((t) => t.upgradeReady).length;

  return {
    totals: {
      tenants: tenants.length,
      byMode,
      pendingApprovals,
      failedSyncs,
      churnRisk,
      upgradeReady,
    },
    tenants: tenants.map((t) => ({
      id: t.id,
      nameEn: t.nameEn,
      nameAr: t.nameAr,
      mode: t.mode,
      country: t.country,
      package: t.package,
      churnRisk: t.churnRisk,
      upgradeReady: t.upgradeReady,
      healthScore: null as number | null,
    })),
  };
}

export async function listReportsForTenant(tenantId: string) {
  return prisma.reportRecord.findMany({
    where: { tenantId },
    orderBy: { periodStart: 'desc' },
    take: 50,
  });
}

export async function getReport(tenantId: string, reportId: string) {
  const r = await prisma.reportRecord.findUnique({ where: { id: reportId } });
  if (!r || r.tenantId !== tenantId) return null;
  return r;
}

export async function triggerMonthly(tenantId: string, actorId: string) {
  return generateMonthlyReport(tenantId, undefined, actorId);
}

export async function triggerWeekly(tenantId: string, actorId: string) {
  return generateWeeklySummary(tenantId, undefined, actorId);
}
