import { prisma } from '@lmms/db';
import {
  SegmentDefinitionSchema,
  previewSegment,
  previewSavedSegment,
  refreshSegment,
  refreshAllSegmentsForTenant,
  seedPrebuiltSegments,
  isSegmentAvailable,
} from '@lmms/segmentation';
import { logAudit } from '@lmms/audit';

async function isErpDataStale(tenantId: string): Promise<boolean> {
  const ds = await prisma.dataSource.findFirst({
    where: { tenantId, type: 'ERP' },
  });
  if (!ds) return true;
  if (ds.status === 'FAILED' || ds.status === 'STALE') return true;
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  return !ds.lastSyncAt || ds.lastSyncAt < twoHoursAgo;
}

export async function listSegments(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  const segments = await prisma.segment.findMany({
    where: { tenantId },
    orderBy: [{ isPrebuilt: 'desc' }, { name: 'asc' }],
  });

  const erpStale =
    tenant.mode === 'ERP_CONNECTED' ? await isErpDataStale(tenantId) : false;

  return segments.map((s) => {
    const availability = isSegmentAvailable(s.mode, tenant.mode);
    return {
      ...s,
      available: availability.available,
      lockReason: availability.reason ?? null,
      staleData: erpStale,
      campaignBlocked: erpStale && s.mode === 'ERP_ONLY',
    };
  });
}

export async function createSegment(opts: {
  tenantId: string;
  actorId: string;
  name: string;
  nameAr?: string;
  definition: unknown;
}) {
  const def = SegmentDefinitionSchema.parse(opts.definition);
  const segment = await prisma.segment.create({
    data: {
      tenantId: opts.tenantId,
      name: opts.name,
      nameAr: opts.nameAr ?? null,
      mode: 'BOTH',
      definition: def as never,
    },
  });
  await refreshSegment(segment.id);
  await logAudit(
    opts.tenantId,
    opts.actorId,
    'segment.create',
    `segment:${segment.id}`,
  );
  return segment;
}

export async function previewDefinition(tenantId: string, definition: unknown) {
  const def = SegmentDefinitionSchema.parse(definition);
  return previewSegment(tenantId, def);
}

export async function previewSaved(segmentId: string) {
  return previewSavedSegment(segmentId);
}

export async function refreshOne(
  segmentId: string,
  actorId: string,
  tenantId: string,
) {
  const result = await refreshSegment(segmentId);
  await logAudit(tenantId, actorId, 'segment.refresh', `segment:${segmentId}`);
  return result;
}

export async function refreshAll(tenantId: string, actorId: string) {
  const results = await refreshAllSegmentsForTenant(tenantId);
  await logAudit(tenantId, actorId, 'segment.refresh.all', `tenant:${tenantId}`);
  return results;
}

export async function ensurePrebuilt(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant_not_found');
  return seedPrebuiltSegments(
    tenantId,
    tenant.mode as 'ERP_CONNECTED' | 'STANDALONE' | 'UPGRADING',
  );
}

export async function segmentSizeHistory(segmentId: string, limit = 30) {
  return prisma.segmentSizeSnapshot.findMany({
    where: { segmentId },
    orderBy: { date: 'desc' },
    take: limit,
  });
}
