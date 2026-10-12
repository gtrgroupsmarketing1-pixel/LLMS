import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';

type AssetCategory =
  | 'LOGO'
  | 'COLOR_PALETTE'
  | 'FONT'
  | 'IMAGE'
  | 'VIDEO'
  | 'TEMPLATE'
  | 'SIGNAGE'
  | 'VEHICLE_WRAP'
  | 'UNIFORM'
  | 'PACKAGING'
  | 'FLYER'
  | 'LOYALTY_CARD'
  | 'PRICE_LIST'
  | 'OTHER';

type AssetUsageRights =
  | 'PERPETUAL'
  | 'TIME_LIMITED'
  | 'LOCATION_LIMITED'
  | 'UNKNOWN';

export interface AssetCreateInput {
  tenantId: string;
  actorId: string;
  name: string;
  nameAr?: string;
  category: AssetCategory;
  fileUrl: string;
  fileMime?: string;
  fileSizeBytes?: number;
  fileWidth?: number;
  fileHeight?: number;
  tags?: Record<string, unknown>;
  usageRights?: AssetUsageRights;
  usageRightsNotes?: string;
  usageExpiresAt?: Date;
  brandKitId?: string;
}

export async function createAsset(input: AssetCreateInput) {
  const asset = await prisma.asset.create({
    data: {
      tenantId: input.tenantId,
      brandKitId: input.brandKitId ?? null,
      category: input.category,
      name: input.name,
      nameAr: input.nameAr ?? null,
      fileUrl: input.fileUrl,
      fileMime: input.fileMime ?? null,
      fileSizeBytes: input.fileSizeBytes ?? null,
      fileWidth: input.fileWidth ?? null,
      fileHeight: input.fileHeight ?? null,
      tags: (input.tags ?? null) as never,
      usageRights: input.usageRights ?? 'UNKNOWN',
      usageRightsNotes: input.usageRightsNotes ?? null,
      usageExpiresAt: input.usageExpiresAt ?? null,
      uploadedBy: input.actorId,
    },
  });
  await logAudit(input.tenantId, input.actorId, 'asset.create', `asset:${asset.id}`);
  return asset;
}

export async function listAssets(opts: {
  tenantId: string;
  category?: AssetCategory;
  search?: string;
  expiringSoonDays?: number;
}) {
  const where: Record<string, unknown> = { tenantId: opts.tenantId };
  if (opts.category) where.category = opts.category;
  if (opts.search) {
    where.OR = [
      { name: { contains: opts.search, mode: 'insensitive' } },
      { nameAr: { contains: opts.search } },
    ];
  }
  if (typeof opts.expiringSoonDays === 'number') {
    const cutoff = new Date(Date.now() + opts.expiringSoonDays * 86_400_000);
    where.usageExpiresAt = { lte: cutoff, not: null };
  }
  return prisma.asset.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
}

export async function getAsset(tenantId: string, assetId: string) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset || asset.tenantId !== tenantId) return null;
  return asset;
}

export async function updateAssetUsage(opts: {
  tenantId: string;
  actorId: string;
  assetId: string;
  usageRights?: AssetUsageRights;
  usageRightsNotes?: string | null;
  usageExpiresAt?: Date | null;
}) {
  const asset = await prisma.asset.findUnique({ where: { id: opts.assetId } });
  if (!asset || asset.tenantId !== opts.tenantId) throw new Error('asset_not_found');

  const updated = await prisma.asset.update({
    where: { id: opts.assetId },
    data: {
      ...(opts.usageRights !== undefined ? { usageRights: opts.usageRights } : {}),
      ...(opts.usageRightsNotes !== undefined
        ? { usageRightsNotes: opts.usageRightsNotes }
        : {}),
      ...(opts.usageExpiresAt !== undefined
        ? { usageExpiresAt: opts.usageExpiresAt }
        : {}),
    },
  });
  await logAudit(opts.tenantId, opts.actorId, 'asset.update', `asset:${updated.id}`);
  return updated;
}

export async function deleteAsset(
  tenantId: string,
  actorId: string,
  assetId: string,
) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset || asset.tenantId !== tenantId) throw new Error('asset_not_found');
  await prisma.asset.delete({ where: { id: assetId } });
  await logAudit(tenantId, actorId, 'asset.delete', `asset:${assetId}`);
  return { deleted: true };
}
