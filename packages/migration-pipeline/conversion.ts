import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';

type ConversionEventType =
  | 'PITCH_SENT'
  | 'DEMO_BOOKED'
  | 'PRICE_QUOTED'
  | 'CONTRACT_DISCUSSED'
  | 'CONVERTED'
  | 'DECLINED'
  | 'DEFERRED';

export async function logConversionEvent(opts: {
  tenantId: string;
  pitchId?: string;
  type: ConversionEventType;
  actorId?: string;
  note?: string;
  meta?: Record<string, unknown>;
}) {
  const event = await prisma.conversionEvent.create({
    data: {
      tenantId: opts.tenantId,
      pitchId: opts.pitchId ?? null,
      type: opts.type,
      actorId: opts.actorId ?? null,
      note: opts.note ?? null,
      meta: (opts.meta ?? null) as never,
    },
  });
  await logAudit(
    opts.tenantId,
    opts.actorId ?? 'system',
    `migration_pipeline.${opts.type.toLowerCase()}`,
    `conversion_event:${event.id}`,
  );
  return event;
}

export interface ConversionRateReport {
  totalPitches: number;
  accepted: number;
  declined: number;
  deferred: number;
  pending: number;
  conversionRate: number;
  declineReasons: Array<{ reason: string; count: number }>;
}

export async function conversionReport(
  sinceDate: Date = new Date(Date.now() - 90 * 86_400_000),
): Promise<ConversionRateReport> {
  const pitches = await prisma.migrationPitch.findMany({
    where: { sentAt: { gte: sinceDate } },
  });

  const accepted = pitches.filter((p) => p.outcome === 'ACCEPTED').length;
  const declined = pitches.filter((p) => p.outcome === 'DECLINED').length;
  const deferred = pitches.filter((p) => p.outcome === 'DEFERRED').length;
  const pending = pitches.filter((p) => p.outcome === 'PENDING').length;
  const total = pitches.length;

  const declinedPitches = pitches.filter((p) => p.outcome === 'DECLINED');
  const reasonCounts = new Map<string, number>();
  for (const p of declinedPitches) {
    const reason = (p.decisionNote ?? 'unspecified').trim() || 'unspecified';
    reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
  }

  return {
    totalPitches: total,
    accepted,
    declined,
    deferred,
    pending,
    conversionRate: total > 0 ? Math.round((accepted / total) * 10000) / 100 : 0,
    declineReasons: [...reasonCounts.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
  };
}
