import { prisma } from '@lmms/db';
import { computeReadiness, type ReadinessResult } from './scoring';

export interface PitchPack {
  tenantId: string;
  tenantName: string;
  tenantNameAr: string;
  country: string;
  currentMode: string;
  score: number;
  tier: string;
  headline: string;
  performance: {
    attributedRevenue90d: number;
    messagesSent90d: number;
    engagementRate: number;
    healthScore: number;
  };
  benefits: string[];
  talkingPoints: string[];
  evidence: Array<{ label: string; value: string }>;
}

/**
 * Builds a pitch pack for the Migration Lead. Deterministic — reuses the
 * same criteria the scoring used and enumerates the specific ERP-only
 * features the tenant is currently missing.
 */
export async function buildPitchPack(tenantId: string): Promise<PitchPack> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  const readiness: ReadinessResult = await computeReadiness(tenantId);

  const benefits: string[] = [];
  const talkingPoints: string[] = [];

  if (readiness.criteria.attributedRevenue90d > 0) {
    benefits.push(
      'Order-level attribution — match every order to the campaign that produced it',
    );
    talkingPoints.push(
      `You have already generated AED ${readiness.criteria.attributedRevenue90d.toFixed(2)} in attributed revenue in the last 90 days. ERP connection lets us attribute every order precisely, not just promo-code redemptions.`,
    );
  }

  benefits.push(
    'Order-triggered automations — review requests fire the moment an order is delivered',
    'VIP / One-timers / Subscription segments based on real order history',
    'Repeat order rate and LTV reporting',
    'Pickup reminder automations',
  );

  if (readiness.criteria.campaignsSent90d >= 4) {
    talkingPoints.push(
      `You have already run ${readiness.criteria.campaignsSent90d} campaigns in the last 90 days. With ERP automations, those manual sends become set-and-forget.`,
    );
  }

  if (readiness.criteria.engagementRate >= 0.15) {
    talkingPoints.push(
      `Your engagement rate is ${(readiness.criteria.engagementRate * 100).toFixed(1)}% — well above GCC baseline. That audience deserves order-level targeting.`,
    );
  }

  if (readiness.tier === 'HOT') {
    talkingPoints.push(
      'Your score places you in our highest tier of upgrade-ready clients — most of your peers who connect the ERP see measurable lift within one quarter.',
    );
  }

  const evidence: Array<{ label: string; value: string }> = [
    { label: 'Attributed revenue (90d)', value: `AED ${readiness.criteria.attributedRevenue90d.toFixed(2)}` },
    { label: 'Messages sent (90d)', value: String(readiness.criteria.messagesSent90d) },
    { label: 'Campaigns sent (90d)', value: String(readiness.criteria.campaignsSent90d) },
    { label: 'Engagement rate', value: `${(readiness.criteria.engagementRate * 100).toFixed(1)}%` },
    { label: 'Health score', value: String(readiness.criteria.healthScore) },
    { label: 'Client tenure', value: `${readiness.criteria.tenureDays} days` },
  ];

  const headline =
    readiness.tier === 'HOT'
      ? `${tenant.nameEn} is upgrade-ready — order-level intelligence unlocks 4 new automations`
      : readiness.tier === 'WARM'
        ? `${tenant.nameEn} shows strong signals — ERP connection would deepen attribution`
        : `${tenant.nameEn} is early — continue Standalone growth before pitching ERP`;

  return {
    tenantId: tenant.id,
    tenantName: tenant.nameEn,
    tenantNameAr: tenant.nameAr,
    country: tenant.country,
    currentMode: tenant.mode,
    score: readiness.score,
    tier: readiness.tier,
    headline,
    performance: {
      attributedRevenue90d: readiness.criteria.attributedRevenue90d,
      messagesSent90d: readiness.criteria.messagesSent90d,
      engagementRate: readiness.criteria.engagementRate,
      healthScore: readiness.criteria.healthScore,
    },
    benefits,
    talkingPoints,
    evidence,
  };
}
