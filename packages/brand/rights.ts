import { prisma } from '@lmms/db';

export interface ExpiringAsset {
  id: string;
  name: string;
  category: string;
  usageRights: string;
  usageExpiresAt: string | null;
  daysUntilExpiry: number | null;
}

export async function listExpiringAssets(
  tenantId: string,
  withinDays = 30,
): Promise<ExpiringAsset[]> {
  const cutoff = new Date(Date.now() + withinDays * 86_400_000);
  const assets = await prisma.asset.findMany({
    where: {
      tenantId,
      usageExpiresAt: { lte: cutoff, not: null },
    },
    orderBy: { usageExpiresAt: 'asc' },
    take: 200,
  });
  const now = Date.now();
  return assets.map((a) => ({
    id: a.id,
    name: a.name,
    category: a.category,
    usageRights: a.usageRights,
    usageExpiresAt: a.usageExpiresAt?.toISOString() ?? null,
    daysUntilExpiry: a.usageExpiresAt
      ? Math.ceil((a.usageExpiresAt.getTime() - now) / 86_400_000)
      : null,
  }));
}
