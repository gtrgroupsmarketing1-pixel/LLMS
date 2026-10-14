import { prisma } from '@lmms/db';

export interface RankedTenant {
  tenantId: string;
  nameEn: string;
  nameAr: string;
  country: string;
  score: number;
  tier: string;
  attributedRevenue90d: number;
  tenureDays: number;
  lastPitchedAt: string | null;
  convertedAt: string | null;
}

/**
 * Ranks all Standalone / Upgrading tenants by their latest readiness score.
 * HOT tenants are surfaced first, then WARM, then COLD. Within a tier, higher
 * score wins. Ties broken by longer tenure (more established clients convert
 * more reliably).
 */
export async function rankedStandaloneTenants(): Promise<RankedTenant[]> {
  const tenants = await prisma.tenant.findMany({
    where: {
      status: 'ACTIVE',
      mode: { in: ['STANDALONE', 'UPGRADING'] },
    },
  });

  const ranked: RankedTenant[] = [];
  for (const t of tenants) {
    const latest = await prisma.upgradeReadiness.findFirst({
      where: { tenantId: t.id },
      orderBy: { date: 'desc' },
    });
    const criteria = (latest?.criteria ?? {}) as Record<string, unknown>;
    const tenureDays = Math.floor(
      (Date.now() - t.createdAt.getTime()) / 86_400_000,
    );
    ranked.push({
      tenantId: t.id,
      nameEn: t.nameEn,
      nameAr: t.nameAr,
      country: t.country,
      score: latest?.score ?? 0,
      tier: latest?.tier ?? 'COLD',
      attributedRevenue90d: Number(criteria.attributedRevenue90d ?? 0),
      tenureDays,
      lastPitchedAt: latest?.pitchedAt?.toISOString() ?? null,
      convertedAt: latest?.convertedAt?.toISOString() ?? null,
    });
  }

  const tierWeight: Record<string, number> = { HOT: 3, WARM: 2, COLD: 1 };

  return ranked.sort((a, b) => {
    const tw = (tierWeight[b.tier] ?? 0) - (tierWeight[a.tier] ?? 0);
    if (tw !== 0) return tw;
    if (b.score !== a.score) return b.score - a.score;
    return b.tenureDays - a.tenureDays;
  });
}
