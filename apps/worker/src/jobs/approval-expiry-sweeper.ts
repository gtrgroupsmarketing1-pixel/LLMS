import { prisma } from '@lmms/db';

/**
 * Logs content approval links that expired unused. The link rows are kept
 * for audit; they simply cannot be consumed after expiresAt.
 */
export async function approvalExpirySweeperJob() {
  const now = new Date();
  const expired = await prisma.contentApprovalLink.findMany({
    where: {
      usedAt: null,
      expiresAt: { lte: now },
    },
    take: 500,
  });

  for (const l of expired) {
    await prisma.contentNotification.create({
      data: {
        tenantId: l.tenantId,
        cardId: l.cardId,
        kind: 'REJECTION_NOTICE',
        channel: 'SYSTEM',
        status: 'INFO',
        meta: {
          reason: 'approval_link_expired',
          expiresAt: l.expiresAt.toISOString(),
        } as never,
      },
    });
  }

  if (expired.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(`[approval-expiry-sweeper] expired=${expired.length}`);
  }
}
