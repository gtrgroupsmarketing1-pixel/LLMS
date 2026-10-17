import { prisma } from '@lmms/db';

export type LimitType = 'campaigns' | 'messages' | 'locations';

export interface LimitCheckResult {
  allowed: boolean;
  limit: number;
  current: number;
  reason?: string;
}

/**
 * Enforces the self-serve limits defined in SelfServeConfig.
 * Agency tenants (isSelfServe=false) always return allowed:true.
 */
export async function checkLimit(
  tenantId: string,
  type: LimitType,
): Promise<LimitCheckResult> {
  const config = await prisma.selfServeConfig.findUnique({ where: { tenantId } });

  if (!config || !config.isSelfServe) {
    return { allowed: true, limit: Infinity, current: 0 };
  }

  if (type === 'campaigns') {
    const current = await prisma.campaign.count({
      where: { tenantId, status: { in: ['ACTIVE', 'SENT'] } },
    });
    return {
      allowed: current < config.maxCampaigns,
      limit: config.maxCampaigns,
      current,
      reason: current >= config.maxCampaigns ? 'campaign_limit_reached' : undefined,
    };
  }

  if (type === 'messages') {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const current = await prisma.message.count({
      where: { tenantId, sentAt: { gte: startOfMonth } },
    });
    return {
      allowed: current < config.maxMessagesMonthly,
      limit: config.maxMessagesMonthly,
      current,
      reason: current >= config.maxMessagesMonthly ? 'message_limit_reached' : undefined,
    };
  }

  if (type === 'locations') {
    const current = await prisma.location.count({ where: { tenantId } });
    return {
      allowed: current < config.maxLocations,
      limit: config.maxLocations,
      current,
      reason: current >= config.maxLocations ? 'location_limit_reached' : undefined,
    };
  }

  return { allowed: false, limit: 0, current: 0, reason: 'unknown_limit_type' };
}

/**
 * Asserts a limit and throws if exceeded.
 */
export async function assertLimit(tenantId: string, type: LimitType): Promise<void> {
  const check = await checkLimit(tenantId, type);
  if (!check.allowed) {
    throw new Error(`limit_exceeded:${type}:${check.reason}`);
  }
}
