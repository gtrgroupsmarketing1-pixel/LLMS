import { prisma } from '@lmms/db';

export type ReadinessTier = 'HOT' | 'WARM' | 'COLD';

export interface ReadinessCriteria {
  attributedRevenue90d: number;
  messagesSent90d: number;
  campaignsSent90d: number;
  engagementRate: number;
  tenureDays: number;
  healthScore: number;
  dataSourceCount: number;
  hasCsvOrders: boolean;
}

export interface ReadinessResult {
  score: number;
  tier: ReadinessTier;
  criteria: ReadinessCriteria;
}

/**
 * Compute a readiness score (0-100) for a Standalone tenant to move to
 * ERP-Connected. Higher score = more likely to benefit from order-level
 * intelligence and advanced automations.
 *
 * Score weights:
 *   attributedRevenue90d >= 5000 → +25
 *   messagesSent90d >= 1000      → +15
 *   campaignsSent90d >= 4        → +10
 *   engagementRate >= 0.15       → +15
 *   tenureDays >= 90             → +10
 *   healthScore >= 70            → +15
 *   dataSourceCount >= 2         → +5
 *   hasCsvOrders                 → +5
 */
export async function computeReadiness(tenantId: string): Promise<ReadinessResult> {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86_400_000);

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  const [messagesSent90d, campaignsSent90d, deliveredCount, readCount, dataSourceCount] =
    await Promise.all([
      prisma.message.count({
        where: { tenantId, sentAt: { gte: ninetyDaysAgo } },
      }),
      prisma.campaign.count({
        where: { tenantId, status: 'SENT', sentAt: { gte: ninetyDaysAgo } },
      }),
      prisma.message.count({
        where: {
          tenantId,
          sentAt: { gte: ninetyDaysAgo },
          status: { in: ['DELIVERED', 'READ', 'REPLIED'] },
        },
      }),
      prisma.message.count({
        where: {
          tenantId,
          sentAt: { gte: ninetyDaysAgo },
          status: { in: ['READ', 'REPLIED'] },
        },
      }),
      prisma.dataSource.count({ where: { tenantId } }),
    ]);

  // Attributed revenue over 90d
  const attributedAgg = await prisma.attribution.aggregate({
    where: {
      tenantId,
      attributedAt: { gte: ninetyDaysAgo },
    },
    _sum: { revenue: true },
  });
  const attributedRevenue90d = Number(attributedAgg._sum.revenue ?? 0);

  // Tenure
  const tenureDays = Math.floor(
    (now.getTime() - tenant.createdAt.getTime()) / 86_400_000,
  );

  // Health score (latest snapshot)
  const latestHealth = await prisma.tenantHealthScore.findFirst({
    where: { tenantId },
    orderBy: { date: 'desc' },
  });
  const healthScore = latestHealth?.score ?? 0;

  // CSV orders present?
  const csvOrders = await prisma.order.count({ where: { tenantId } });
  const hasCsvOrders = csvOrders > 0;

  const engagementRate =
    messagesSent90d > 0 ? Math.round((readCount / messagesSent90d) * 10000) / 10000 : 0;

  void deliveredCount;

  const criteria: ReadinessCriteria = {
    attributedRevenue90d,
    messagesSent90d,
    campaignsSent90d,
    engagementRate,
    tenureDays,
    healthScore,
    dataSourceCount,
    hasCsvOrders,
  };

  let score = 0;
  if (attributedRevenue90d >= 5000) score += 25;
  else if (attributedRevenue90d >= 1000) score += 15;
  else if (attributedRevenue90d > 0) score += 5;

  if (messagesSent90d >= 1000) score += 15;
  else if (messagesSent90d >= 300) score += 8;

  if (campaignsSent90d >= 4) score += 10;
  else if (campaignsSent90d >= 1) score += 4;

  if (engagementRate >= 0.15) score += 15;
  else if (engagementRate >= 0.05) score += 8;

  if (tenureDays >= 90) score += 10;
  else if (tenureDays >= 30) score += 5;

  if (healthScore >= 70) score += 15;
  else if (healthScore >= 50) score += 8;

  if (dataSourceCount >= 2) score += 5;

  if (hasCsvOrders) score += 5;

  score = Math.min(100, Math.max(0, score));

  const tier: ReadinessTier = score >= 70 ? 'HOT' : score >= 45 ? 'WARM' : 'COLD';

  return { score, tier, criteria };
}
