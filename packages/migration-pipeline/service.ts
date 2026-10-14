import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import { computeReadiness } from './scoring';
import { rankedStandaloneTenants } from './ranker';
import { buildPitchPack } from './pitch-pack';
import { logConversionEvent, conversionReport } from './conversion';

export async function scoreAndRecord(tenantId: string): Promise<{
  score: number;
  tier: string;
}> {
  const result = await computeReadiness(tenantId);
  await prisma.upgradeReadiness.create({
    data: {
      tenantId,
      score: result.score,
      tier: result.tier,
      criteria: result.criteria as never,
    },
  });
  return { score: result.score, tier: result.tier };
}

export async function rankedPipeline() {
  return rankedStandaloneTenants();
}

export async function sendPitch(opts: {
  tenantId: string;
  actorId: string;
}) {
  const pack = await buildPitchPack(opts.tenantId);
  const latest = await prisma.upgradeReadiness.findFirst({
    where: { tenantId: opts.tenantId },
    orderBy: { date: 'desc' },
  });

  const pitch = await prisma.migrationPitch.create({
    data: {
      tenantId: opts.tenantId,
      readinessId: latest?.id ?? null,
      score: pack.score,
      tier: pack.tier,
      pitchPack: pack as never,
      sentBy: opts.actorId,
      outcome: 'PENDING',
    },
  });

  if (latest) {
    await prisma.upgradeReadiness.update({
      where: { id: latest.id },
      data: { pitchedAt: new Date(), pitchedBy: opts.actorId },
    });
  }

  await logConversionEvent({
    tenantId: opts.tenantId,
    pitchId: pitch.id,
    type: 'PITCH_SENT',
    actorId: opts.actorId,
    note: `Pitch sent for score ${pack.score} (${pack.tier})`,
  });

  await logAudit(opts.tenantId, opts.actorId, 'migration_pitch.sent', `pitch:${pitch.id}`);
  return pitch;
}

export async function recordPitchOutcome(opts: {
  tenantId: string;
  actorId: string;
  pitchId: string;
  outcome: 'ACCEPTED' | 'DECLINED' | 'DEFERRED';
  note?: string;
}) {
  const updated = await prisma.migrationPitch.update({
    where: { id: opts.pitchId },
    data: {
      outcome: opts.outcome,
      decidedAt: new Date(),
      decisionNote: opts.note ?? null,
    },
  });

  if (opts.outcome === 'DECLINED' || opts.outcome === 'DEFERRED') {
    const latest = await prisma.upgradeReadiness.findFirst({
      where: { tenantId: opts.tenantId },
      orderBy: { date: 'desc' },
    });
    if (latest) {
      await prisma.upgradeReadiness.update({
        where: { id: latest.id },
        data: { notConvertedReason: opts.note ?? 'unspecified' },
      });
    }
  }

  await logConversionEvent({
    tenantId: opts.tenantId,
    pitchId: opts.pitchId,
    type: opts.outcome === 'ACCEPTED' ? 'CONVERTED' : opts.outcome,
    actorId: opts.actorId,
    note: opts.note,
  });

  return updated;
}

export async function markConverted(opts: {
  tenantId: string;
  actorId: string;
  pitchId: string;
}) {
  const latest = await prisma.upgradeReadiness.findFirst({
    where: { tenantId: opts.tenantId },
    orderBy: { date: 'desc' },
  });
  if (latest) {
    await prisma.upgradeReadiness.update({
      where: { id: latest.id },
      data: { convertedAt: new Date() },
    });
  }
  await prisma.migrationPitch.update({
    where: { id: opts.pitchId },
    data: { outcome: 'ACCEPTED', decidedAt: new Date() },
  });
  await logConversionEvent({
    tenantId: opts.tenantId,
    pitchId: opts.pitchId,
    type: 'CONVERTED',
    actorId: opts.actorId,
  });
  await logAudit(opts.tenantId, opts.actorId, 'migration_pitch.converted', `pitch:${opts.pitchId}`);
  return { converted: true };
}

export async function listPitches(tenantId?: string) {
  return prisma.migrationPitch.findMany({
    where: tenantId ? { tenantId } : {},
    include: { events: true },
    orderBy: { sentAt: 'desc' },
    take: 200,
  });
}

export async function pipelineConversionReport(sinceDays = 90) {
  const since = new Date(Date.now() - sinceDays * 86_400_000);
  return conversionReport(since);
}
