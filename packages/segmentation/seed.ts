import { prisma } from '@lmms/db';
import { PREBUILT_ERP, PREBUILT_STANDALONE, PREBUILT_BOTH } from './prebuilt';

export async function seedPrebuiltSegments(
  tenantId: string,
  _mode: 'ERP_CONNECTED' | 'STANDALONE' | 'UPGRADING',
): Promise<number> {
  const all = [...PREBUILT_ERP, ...PREBUILT_STANDALONE, ...PREBUILT_BOTH];
  for (const p of all) {
    await prisma.segment.upsert({
      where: { tenantId_name: { tenantId, name: p.name } },
      update: {},
      create: {
        tenantId,
        name: p.name,
        nameAr: p.nameAr,
        mode: p.mode,
        definition: p.definition as never,
        isPrebuilt: true,
        isSystem: true,
      },
    });
  }
  return all.length;
}

export function isSegmentAvailable(
  segmentMode: string,
  tenantMode: string,
): { available: boolean; reason?: string } {
  if (segmentMode === 'BOTH') return { available: true };
  if (
    segmentMode === 'ERP_ONLY' &&
    tenantMode !== 'ERP_CONNECTED' &&
    tenantMode !== 'UPGRADING'
  ) {
    return { available: false, reason: 'Requires ERP connection' };
  }
  if (segmentMode === 'STANDALONE_ONLY' && tenantMode === 'ERP_CONNECTED') {
    return { available: false, reason: 'Available in Standalone mode' };
  }
  return { available: true };
}
