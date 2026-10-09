import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import type { TenantCreateInput, TenantListQuery } from '@lmms/contracts';

export async function createTenant(input: TenantCreateInput, actorId: string) {
  const tenant = await prisma.tenant.create({
    data: {
      nameAr: input.nameAr,
      nameEn: input.nameEn,
      mode: input.mode,
      country: input.country,
      currency: input.currency,
      timezone: input.timezone,
      package: input.package,
      status: input.mode === 'ERP_CONNECTED' ? 'DRAFT' : 'ACTIVE',
    },
  });
  await logAudit(tenant.id, actorId, 'tenant.create', `tenant:${tenant.id}`);
  await recomputeHealthScore(tenant.id);
  await recomputeUpgradeReadiness(tenant.id);
  return tenant;
}

export async function listTenants(params: TenantListQuery) {
  const where: Record<string, unknown> = {};
  if (params.mode) where.mode = params.mode;
  if (params.country) where.country = params.country;
  if (params.search) {
    where.OR = [
      { nameEn: { contains: params.search, mode: 'insensitive' } },
      { nameAr: { contains: params.search } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      take: params.limit,
      skip: params.offset,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.tenant.count({ where }),
  ]);
  return { items, total, limit: params.limit, offset: params.offset };
}

export async function getTenant(id: string) {
  return prisma.tenant.findUnique({ where: { id } });
}

export async function recomputeHealthScore(tenantId: string) {
  const components = { engagement: 20, results: 20, payment: 20, approvalSpeed: 20 };
  const score = Object.values(components).reduce((a, b) => a + b, 0);
  await prisma.tenantHealthScore.create({ data: { tenantId, score, components } });
  if (score < 60) {
    await prisma.tenant.update({ where: { id: tenantId }, data: { churnRisk: true } });
  }
  return score;
}

export async function recomputeUpgradeReadiness(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return null;
  if (tenant.mode !== 'STANDALONE') {
    await prisma.tenant.update({ where: { id: tenantId }, data: { upgradeReady: false } });
    return 0;
  }
  const criteria = { attributedRevenuePositive: true, activeDays: 30, engagementOk: true };
  const score = 75;
  await prisma.upgradeReadiness.create({ data: { tenantId, score, criteria } });
  if (score >= 70) {
    await prisma.tenant.update({ where: { id: tenantId }, data: { upgradeReady: true } });
  }
  return score;
}
