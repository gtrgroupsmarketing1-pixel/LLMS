import { prisma } from '@lmms/db';

export interface ConsistencyIssue {
  assetId: string;
  assetName: string;
  category: string;
  issue: string;
  details?: Record<string, unknown>;
}

export interface ConsistencyReport {
  totalAssets: number;
  checkedAssets: number;
  issuesCount: number;
  issues: ConsistencyIssue[];
}

interface BrandKitColors {
  colors?: Array<{ name: string; hex: string }>;
  fonts?: Array<{ name: string; script: 'arabic' | 'latin' | 'both' }>;
}

function normalizeHex(hex: string): string {
  return hex.trim().toLowerCase().replace('#', '');
}

/**
 * Deterministic checker. Uses the metadata declared by the uploader inside
 * the asset `tags` JSON — `declaredColors` (hex strings) and `declaredFonts`
 * (font family names). Compares against the tenant's brand kit. Flags
 * off-brand assets without any image analysis.
 */
export async function runConsistencyCheck(
  tenantId: string,
): Promise<ConsistencyReport> {
  const kit = await prisma.brandKit.findUnique({ where: { tenantId } });
  if (!kit) {
    return { totalAssets: 0, checkedAssets: 0, issuesCount: 0, issues: [] };
  }

  const kitData = kit as unknown as BrandKitColors;
  const allowedHexes = new Set(
    (kitData.colors ?? []).map((c) => normalizeHex(c.hex)),
  );
  const allowedFonts = new Set((kitData.fonts ?? []).map((f) => f.name));

  const assets = await prisma.asset.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      category: true,
      tags: true,
    },
  });

  const issues: ConsistencyIssue[] = [];
  let checked = 0;

  for (const asset of assets) {
    const tags = (asset.tags ?? {}) as Record<string, unknown>;
    const declaredColors = Array.isArray(tags.declaredColors)
      ? (tags.declaredColors as string[])
      : null;
    const declaredFonts = Array.isArray(tags.declaredFonts)
      ? (tags.declaredFonts as string[])
      : null;

    if (!declaredColors && !declaredFonts) continue;
    checked += 1;

    if (declaredColors) {
      for (const hex of declaredColors) {
        if (!allowedHexes.has(normalizeHex(hex))) {
          issues.push({
            assetId: asset.id,
            assetName: asset.name,
            category: asset.category,
            issue: 'off_brand_color',
            details: { hex },
          });
        }
      }
    }

    if (declaredFonts) {
      for (const font of declaredFonts) {
        if (!allowedFonts.has(font)) {
          issues.push({
            assetId: asset.id,
            assetName: asset.name,
            category: asset.category,
            issue: 'off_brand_font',
            details: { font },
          });
        }
      }
    }
  }

  return {
    totalAssets: assets.length,
    checkedAssets: checked,
    issuesCount: issues.length,
    issues,
  };
}
