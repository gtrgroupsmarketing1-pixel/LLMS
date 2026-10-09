import { prisma } from '@lmms/db';
import { evaluateDefinition, type SegmentDefinition } from './dsl';
import { loadNormalizedCustomers } from './normalize';

export interface RefreshResult {
  segmentId: string;
  size: number;
}

export async function refreshSegment(segmentId: string): Promise<RefreshResult> {
  const segment = await prisma.segment.findUnique({ where: { id: segmentId } });
  if (!segment) throw new Error('segment_not_found');

  const customers = await loadNormalizedCustomers(segment.tenantId);
  const def = segment.definition as unknown as SegmentDefinition;
  const matching = customers.filter((c) => evaluateDefinition(def, c));

  await prisma.$transaction([
    prisma.segmentMembership.deleteMany({ where: { segmentId } }),
    prisma.segmentMembership.createMany({
      data: matching.map((c) => ({
        segmentId,
        customerId: c.id,
        tenantId: segment.tenantId,
      })),
      skipDuplicates: true,
    }),
    prisma.segment.update({
      where: { id: segmentId },
      data: { lastRefreshed: new Date(), lastCount: matching.length },
    }),
    prisma.segmentSizeSnapshot.create({
      data: { tenantId: segment.tenantId, segmentId, size: matching.length },
    }),
  ]);

  return { segmentId, size: matching.length };
}

export async function refreshAllSegmentsForTenant(
  tenantId: string,
): Promise<RefreshResult[]> {
  const segments = await prisma.segment.findMany({ where: { tenantId } });
  const results: RefreshResult[] = [];
  for (const s of segments) results.push(await refreshSegment(s.id));
  return results;
}
