import { prisma } from '@lmms/db';
import type { RawMetrics } from './metrics';
import type { Period } from './period';

export async function collectRawMetrics(
  tenantId: string,
  period: Period,
): Promise<RawMetrics> {
  const { start, end } = period;

  const [
    campaignsSent,
    messagesSent,
    messagesDelivered,
    messagesRead,
    messagesReplied,
    messagesFailed,
    optOuts,
  ] = await Promise.all([
    prisma.campaign.count({
      where: {
        tenantId,
        status: 'SENT',
        OR: [
          { sentAt: { gte: start, lte: end } },
          { sentAt: null, updatedAt: { gte: start, lte: end } },
        ],
      },
    }),
    prisma.message.count({
      where: { tenantId, sentAt: { gte: start, lte: end } },
    }),
    prisma.message.count({
      where: {
        tenantId,
        sentAt: { gte: start, lte: end },
        status: { in: ['DELIVERED', 'READ', 'REPLIED'] },
      },
    }),
    prisma.message.count({
      where: {
        tenantId,
        sentAt: { gte: start, lte: end },
        status: { in: ['READ', 'REPLIED'] },
      },
    }),
    prisma.message.count({
      where: { tenantId, sentAt: { gte: start, lte: end }, status: 'REPLIED' },
    }),
    prisma.message.count({
      where: {
        tenantId,
        sentAt: { gte: start, lte: end },
        status: { in: ['FAILED', 'UNDELIVERED'] },
      },
    }),
    prisma.consentRecord.count({
      where: { tenantId, status: 'OPT_OUT', timestamp: { gte: start, lte: end } },
    }),
  ]);

  let totalRecipients = 0;
  try {
    totalRecipients = await prisma.segmentMembership.count({ where: { tenantId } });
  } catch {
    totalRecipients = 0;
  }

  return {
    campaignsSent,
    messagesSent,
    messagesDelivered,
    messagesRead,
    messagesReplied,
    messagesFailed,
    optOuts,
    attributedRevenue: 0,
    attributedOrders: 0,
    unattributedRevenue: 0,
    commercialContractsSigned: 0,
    commercialContractValue: 0,
    reviewsNew: 0,
    reviewsRatingSum: 0,
    reviewsResponded: 0,
    gbpCalls: 0,
    gbpDirections: 0,
    adSpend: 0,
    adRevenue: 0,
    totalRecipients,
  };
}
