import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import {
  collectRawMetrics,
  computeKpis,
  applyModeFilter,
  lastCompletedMonth,
  type Period,
} from '@lmms/reporting';
import { buildReport as buildAttributionReport } from '@lmms/attribution';
import { buildCohortSnapshot } from './cohorts';
import { compareKpis } from './comparison';
import { generateShareToken } from './share-token';

export interface DeckInput {
  tenantId: string;
  actorId: string;
  periodStart: Date;
  periodEnd: Date;
}

export interface DeckMetrics {
  period: { start: string; end: string };
  kpis: Record<string, unknown>;
  comparison: ReturnType<typeof compareKpis>;
  cohort: Awaited<ReturnType<typeof buildCohortSnapshot>> | null;
  attribution: {
    totalAttributedRevenue: number;
    totalAttributedOrders: number;
    unattributedRevenue: number;
    byConfidence: Record<string, { revenue: number; orders: number }>;
  } | null;
}

export interface DeckHighlights {
  positive: string[];
  negative: string[];
}

export interface DeckRecommendations {
  actions: Array<{ key: string; title: string; rationale: string }>;
}

function buildHighlights(comparison: ReturnType<typeof compareKpis>): DeckHighlights {
  const positive: string[] = [];
  const negative: string[] = [];
  for (const d of comparison) {
    if (d.direction === 'up' && d.changePercent !== null) {
      positive.push(`${d.key} up ${d.changePercent}%`);
    }
    if (d.direction === 'down' && d.changePercent !== null) {
      negative.push(`${d.key} down ${Math.abs(d.changePercent)}%`);
    }
  }
  return { positive: positive.slice(0, 5), negative: negative.slice(0, 5) };
}

function buildRecommendations(
  kpis: Record<string, unknown>,
  comparison: ReturnType<typeof compareKpis>,
): DeckRecommendations {
  const actions: DeckRecommendations['actions'] = [];
  const optOut = (kpis.optOutRate as number | undefined) ?? 0;
  const replyRate = (kpis.replyRate as number | undefined) ?? 0;
  const readRate = (kpis.readRate as number | undefined) ?? 0;

  if (optOut > 0.02) {
    actions.push({
      key: 'reduce_opt_out',
      title: 'Investigate opt-out spike',
      rationale: `Opt-out rate at ${(optOut * 100).toFixed(1)}% — above 2% threshold.`,
    });
  }
  if (replyRate < 0.05 && readRate > 0.4) {
    actions.push({
      key: 'improve_cta',
      title: 'Rewrite call-to-action',
      rationale: 'High read rate with low reply rate — CTA is not converting.',
    });
  }
  const revenueDelta = comparison.find((c) => c.key === 'attributedRevenue');
  if (revenueDelta?.direction === 'down') {
    actions.push({
      key: 'revenue_recovery',
      title: 'Boost attributed revenue',
      rationale: 'Attributed revenue declined vs. previous period.',
    });
  }
  if (actions.length === 0) {
    actions.push({
      key: 'maintain',
      title: 'Maintain current playbook',
      rationale: 'All primary KPIs healthy. Focus on scaling winners.',
    });
  }
  return { actions };
}

export async function buildDeck(input: DeckInput) {
  const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  const current: Period = { start: input.periodStart, end: input.periodEnd };
  const currentRaw = await collectRawMetrics(input.tenantId, current);
  const currentKpis = computeKpis(currentRaw);
  const currentFiltered = applyModeFilter(
    currentKpis,
    tenant.mode as 'ERP_CONNECTED' | 'STANDALONE' | 'UPGRADING',
  ) as typeof currentKpis;

  const prevEnd = new Date(input.periodStart.getTime() - 1);
  const prevStart = new Date(
    Date.UTC(prevEnd.getUTCFullYear(), prevEnd.getUTCMonth() - 2, 1),
  );
  const previous: Period = { start: prevStart, end: prevEnd };
  const prevRaw = await collectRawMetrics(input.tenantId, previous);
  const prevKpis = computeKpis(prevRaw);

  const comparison = compareKpis(currentFiltered, prevKpis);

  let cohort: Awaited<ReturnType<typeof buildCohortSnapshot>> | null = null;
  try {
    cohort = await buildCohortSnapshot({
      tenantId: input.tenantId,
      cohortDate: input.periodStart,
    });
  } catch {
    cohort = null;
  }

  let attribution: DeckMetrics['attribution'] = null;
  try {
    const report = await buildAttributionReport(
      input.tenantId,
      input.periodStart,
      input.periodEnd,
    );
    attribution = {
      totalAttributedRevenue: report.totalAttributedRevenue,
      totalAttributedOrders: report.totalAttributedOrders,
      unattributedRevenue: report.unattributedRevenue,
      byConfidence: report.byConfidence,
    };
  } catch {
    attribution = null;
  }

  const metrics: DeckMetrics = {
    period: {
      start: input.periodStart.toISOString(),
      end: input.periodEnd.toISOString(),
    },
    kpis: currentFiltered as Record<string, unknown>,
    comparison,
    cohort,
    attribution,
  };

  const highlights = buildHighlights(comparison);
  const recommendations = buildRecommendations(
    currentFiltered as Record<string, unknown>,
    comparison,
  );

  const shareToken = generateShareToken();

  const deck = await prisma.qbrDeck.upsert({
    where: {
      tenantId_periodStart: {
        tenantId: input.tenantId,
        periodStart: input.periodStart,
      },
    },
    update: {
      periodEnd: input.periodEnd,
      metrics: metrics as never,
      highlights: highlights as never,
      recommendations: recommendations as never,
      status: 'READY',
      shareToken,
      generatedBy: input.actorId,
      generatedAt: new Date(),
    },
    create: {
      tenantId: input.tenantId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      status: 'READY',
      metrics: metrics as never,
      highlights: highlights as never,
      recommendations: recommendations as never,
      shareToken,
      generatedBy: input.actorId,
    },
  });

  await logAudit(input.tenantId, input.actorId, 'qbr.build', `qbr:${deck.id}`);
  return { deck, rawShareToken: shareToken };
}

export async function getDeck(tenantId: string, deckId: string) {
  const deck = await prisma.qbrDeck.findUnique({ where: { id: deckId } });
  if (!deck || deck.tenantId !== tenantId) return null;
  return deck;
}

export async function listDecks(tenantId: string) {
  return prisma.qbrDeck.findMany({
    where: { tenantId },
    orderBy: { periodStart: 'desc' },
    take: 20,
  });
}

export async function markShared(opts: {
  tenantId: string;
  actorId: string;
  deckId: string;
}) {
  const updated = await prisma.qbrDeck.update({
    where: { id: opts.deckId },
    data: { status: 'SHARED', sharedAt: new Date() },
  });
  await logAudit(opts.tenantId, opts.actorId, 'qbr.share', `qbr:${opts.deckId}`);
  return updated;
}

export async function buildDeckForLastQuarter(
  tenantId: string,
  actorId: string,
): Promise<{ deckId: string; rawShareToken: string }> {
  const lastMonth = lastCompletedMonth();
  const start = new Date(Date.UTC(lastMonth.start.getUTCFullYear(), lastMonth.start.getUTCMonth() - 2, 1));
  const end = lastMonth.end;
  const result = await buildDeck({
    tenantId,
    actorId,
    periodStart: start,
    periodEnd: end,
  });
  return { deckId: result.deck.id, rawShareToken: result.rawShareToken };
}
