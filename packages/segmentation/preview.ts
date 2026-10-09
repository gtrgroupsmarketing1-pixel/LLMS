import { prisma } from '@lmms/db';
import { evaluateDefinition, type SegmentDefinition } from './dsl';
import { loadNormalizedCustomers } from './normalize';
import { maskPhone, maskEmail } from './masking';

export interface PreviewResult {
  count: number;
  sample: Array<{ id: string; name: string | null; phone: string; email: string | null }>;
  elapsedMs: number;
}

const SAMPLE_SIZE = 5;

export async function previewSegment(
  tenantId: string,
  definition: SegmentDefinition,
): Promise<PreviewResult> {
  const t0 = Date.now();
  const customers = await loadNormalizedCustomers(tenantId);
  const matching = customers.filter((c) => evaluateDefinition(definition, c));

  const ids = matching.slice(0, SAMPLE_SIZE).map((c) => c.id);
  const rows = ids.length
    ? await prisma.endCustomer.findMany({ where: { tenantId, id: { in: ids } } })
    : [];

  return {
    count: matching.length,
    sample: rows.map((r) => ({
      id: r.id,
      name: r.name,
      phone: maskPhone(r.phone),
      email: r.email ? maskEmail(r.email) : null,
    })),
    elapsedMs: Date.now() - t0,
  };
}

export async function previewSavedSegment(segmentId: string): Promise<PreviewResult> {
  const segment = await prisma.segment.findUnique({ where: { id: segmentId } });
  if (!segment) throw new Error('segment_not_found');
  return previewSegment(
    segment.tenantId,
    segment.definition as unknown as SegmentDefinition,
  );
}
