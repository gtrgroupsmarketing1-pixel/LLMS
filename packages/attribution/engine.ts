import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import {
  matchPromoCode,
  matchUtm,
  matchCallTracking,
  matchErpOrder,
  type MatchCandidate,
} from './matchers';
import { confidenceFor, type AttributionSource } from './confidence';

export interface OrderAttributionInput {
  tenantId: string;
  actorId: string;
  customerId: string;
  orderId: string;
  revenue: number;
  currency: string;
  orderDate: Date;
  mode: 'ERP_CONNECTED' | 'STANDALONE' | 'UPGRADING';
  hints?: {
    promoCode?: string;
    utmCampaign?: string;
    dialledNumber?: string;
  };
}

export interface AttributionResult {
  attributed: boolean;
  source?: AttributionSource;
  confidence?: 'HIGH' | 'MEDIUM' | 'ESTIMATED';
  attributionId?: string;
  reason?: string;
}

/**
 * Attempts to attribute a single order. Order of preference (highest
 * confidence first):
 *   1. PROMO_CODE (redemption is deterministic)
 *   2. ERP_ORDER_MATCH (order-level match in ERP-Connected mode)
 *   3. UTM (click-based; may not have converted)
 *   4. CALL_TRACKING (estimated)
 *
 * AC-ATT-003: if no match is found we return `{ attributed: false }` and
 * do NOT fabricate attribution. Unmatched activity is reported separately.
 */
export async function attributeOrder(
  input: OrderAttributionInput,
): Promise<AttributionResult> {
  const candidates: MatchCandidate[] = [];

  if (input.hints?.promoCode) {
    const c = await matchPromoCode(input.tenantId, input.customerId, input.hints.promoCode);
    if (c) candidates.push(c);
  }

  if (input.mode === 'ERP_CONNECTED' || input.mode === 'UPGRADING') {
    const c = await matchErpOrder(
      input.tenantId,
      input.customerId,
      input.orderDate,
    );
    if (c) candidates.push(c);
  }

  if (input.hints?.utmCampaign) {
    const c = await matchUtm(input.tenantId, input.hints.utmCampaign);
    if (c) candidates.push(c);
  }

  if (input.hints?.dialledNumber) {
    const c = await matchCallTracking(input.tenantId, input.hints.dialledNumber);
    if (c) candidates.push(c);
  }

  if (candidates.length === 0) {
    return { attributed: false, reason: 'no_match' };
  }

  // Pick highest confidence (HIGH > MEDIUM > ESTIMATED), tie-break by source order.
  const priority: Record<'HIGH' | 'MEDIUM' | 'ESTIMATED', number> = {
    HIGH: 3,
    MEDIUM: 2,
    ESTIMATED: 1,
  };
  candidates.sort((a, b) => priority[b.confidence] - priority[a.confidence]);
  const best = candidates[0];

  const existing = await prisma.attribution.findFirst({
    where: {
      tenantId: input.tenantId,
      orderId: input.orderId,
    },
  });
  if (existing) {
    return {
      attributed: true,
      source: existing.source as AttributionSource,
      confidence: existing.confidence as 'HIGH' | 'MEDIUM' | 'ESTIMATED',
      attributionId: existing.id,
    };
  }

  const created = await prisma.attribution.create({
    data: {
      tenantId: input.tenantId,
      source: best.source,
      confidence: best.confidence,
      campaignId: best.campaignId ?? null,
      adCampaignId: best.adCampaignId ?? null,
      promoCodeId: best.promoCodeId ?? null,
      utmId: best.utmId ?? null,
      messageId: best.messageId ?? null,
      customerId: input.customerId,
      orderId: input.orderId,
      revenue: input.revenue,
      currency: input.currency,
      matchKey: best.matchKey,
      matchMetadata: (best.metadata ?? null) as never,
    },
  });

  await logAudit(
    input.tenantId,
    input.actorId,
    'attribution.matched',
    `attribution:${created.id}`,
  );

  return {
    attributed: true,
    source: best.source as AttributionSource,
    confidence: best.confidence,
    attributionId: created.id,
  };
}

export interface ReattributeInput {
  tenantId: string;
  actorId: string;
  since: Date;
}

/**
 * Batch re-attribution pass. Runs daily or on-demand. Walks orders in the
 * window that do not yet have an attribution row and attempts a match.
 * Never updates an existing row — attribution is append-only.
 */
export async function reattributeOrders(input: ReattributeInput) {
  const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  const attributed = await prisma.attribution.findMany({
    where: { tenantId: input.tenantId },
    select: { orderId: true },
  });
  const attributedOrderIds = new Set(
    attributed.map((a) => a.orderId).filter((x): x is string => !!x),
  );

  const orders = await prisma.order.findMany({
    where: {
      tenantId: input.tenantId,
      orderDate: { gte: input.since },
    },
    take: 500,
  });

  let attributedCount = 0;
  let unmatched = 0;

  for (const o of orders) {
    if (attributedOrderIds.has(o.id)) continue;
    const result = await attributeOrder({
      tenantId: input.tenantId,
      actorId: input.actorId,
      customerId: o.customerId,
      orderId: o.id,
      revenue: Number(o.amount),
      currency: o.currency,
      orderDate: o.orderDate,
      mode: tenant.mode as 'ERP_CONNECTED' | 'STANDALONE' | 'UPGRADING',
    });
    if (result.attributed) attributedCount += 1;
    else unmatched += 1;
  }

  return { attributedCount, unmatched };
}

export async function attributeManual(opts: {
  tenantId: string;
  actorId: string;
  customerId?: string;
  campaignId?: string;
  revenue: number;
  currency: string;
  note?: string;
}) {
  const created = await prisma.attribution.create({
    data: {
      tenantId: opts.tenantId,
      source: 'MANUAL',
      confidence: 'ESTIMATED',
      campaignId: opts.campaignId ?? null,
      customerId: opts.customerId ?? null,
      revenue: opts.revenue,
      currency: opts.currency,
      matchKey: 'manual',
      matchMetadata: ({ note: opts.note ?? null } as never),
    },
  });
  await logAudit(
    opts.tenantId,
    opts.actorId,
    'attribution.manual',
    `attribution:${created.id}`,
  );
  return created;
}
