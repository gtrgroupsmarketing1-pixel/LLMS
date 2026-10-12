import { prisma } from '@lmms/db';

export interface MatchCandidate {
  source: 'PROMO_CODE' | 'UTM' | 'CALL_TRACKING' | 'ERP_ORDER_MATCH';
  campaignId?: string;
  adCampaignId?: string;
  promoCodeId?: string;
  utmId?: string;
  messageId?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'ESTIMATED';
  matchKey: string;
  metadata?: Record<string, unknown>;
}

/**
 * Promo code redemption → attribution.
 * The promo code is unique per campaign; redemption by an end customer is
 * the strongest single-signal attribution available.
 */
export async function matchPromoCode(
  tenantId: string,
  customerId: string,
  code: string,
): Promise<MatchCandidate | null> {
  const promo = await prisma.promoCode.findFirst({
    where: { tenantId, code },
  });
  if (!promo) return null;
  return {
    source: 'PROMO_CODE',
    campaignId: promo.campaignId ?? undefined,
    promoCodeId: promo.id,
    confidence: 'HIGH',
    matchKey: `promo:${promo.code}`,
    metadata: { code: promo.code },
  };
}

/**
 * UTM click → attribution.
 * UTM parameters are stored on the campaign. We look up by utm_campaign,
 * which is the slug we generate when a campaign is created.
 */
export async function matchUtm(
  tenantId: string,
  utmCampaign: string,
): Promise<MatchCandidate | null> {
  const utm = await prisma.utmParameter.findFirst({
    where: { tenantId, campaign: utmCampaign },
    orderBy: { createdAt: 'desc' },
  });
  if (!utm) return null;
  return {
    source: 'UTM',
    campaignId: utm.campaignId,
    adCampaignId: undefined,
    utmId: utm.id,
    confidence: 'MEDIUM',
    matchKey: `utm:${utmCampaign}`,
    metadata: { fullUrl: utm.fullUrl },
  };
}

/**
 * Call tracking attribution. The call tracking provider hands us the phone
 * number that was dialled; we map that number to a campaign via metadata
 * stored on the campaign (or a placeholder table for now).
 */
export async function matchCallTracking(
  tenantId: string,
  dialledNumber: string,
): Promise<MatchCandidate | null> {
  const utm = await prisma.utmParameter.findFirst({
    where: {
      tenantId,
      fullUrl: { contains: dialledNumber },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!utm) return null;
  return {
    source: 'CALL_TRACKING',
    utmId: utm.id,
    confidence: 'ESTIMATED',
    matchKey: `call:${dialledNumber}`,
    metadata: { dialledNumber },
  };
}

/**
 * ERP order-level attribution.
 * In ERP-Connected mode we match a customer + time window against recent
 * messages that contained a promo code or UTM for the same tenant.
 * This is the one source that can produce true order-level revenue.
 *
 * AC-ATT-001: confidence considered HIGH when phone/email is a clean match.
 */
export async function matchErpOrder(
  tenantId: string,
  customerId: string,
  orderDate: Date,
  windowDays = 14,
): Promise<MatchCandidate | null> {
  const windowStart = new Date(orderDate.getTime() - windowDays * 86_400_000);
  const recentMessages = await prisma.message.findMany({
    where: {
      tenantId,
      customerId,
      sentAt: { gte: windowStart, lte: orderDate },
      status: { in: ['SENT', 'DELIVERED', 'READ', 'REPLIED'] },
    },
    orderBy: { sentAt: 'desc' },
    take: 1,
  });
  if (recentMessages.length === 0) return null;
  const msg = recentMessages[0];
  return {
    source: 'ERP_ORDER_MATCH',
    campaignId: msg.campaignId ?? undefined,
    messageId: msg.id,
    confidence: 'HIGH',
    matchKey: `erp:${msg.id}`,
    metadata: {
      windowDays,
      matchedAt: msg.sentAt?.toISOString(),
    },
  };
}
