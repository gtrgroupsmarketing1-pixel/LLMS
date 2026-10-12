import { prisma } from '@lmms/db';

/**
 * Finds cards sitting in CLIENT_REVIEW for more than 48 hours and logs a
 * reminder. Delivery to the actual client channel lands in V2.4+.
 */
export async function contentApprovalReminderJob() {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const stale = await prisma.contentCard.findMany({
    where: {
      status: 'CLIENT_REVIEW',
      updatedAt: { lt: cutoff },
    },
    select: {
      id: true,
      tenantId: true,
      title: true,
      updatedAt: true,
    },
    take: 500,
  });

  for (const c of stale) {
    await prisma.contentNotification.create({
      data: {
        tenantId: c.tenantId,
        cardId: c.id,
        kind: 'APPROVAL_REMINDER',
        channel: 'WHATSAPP',
        status: 'QUEUED',
        meta: {
          reason: 'awaiting_client_review_over_48h',
          lastUpdatedAt: c.updatedAt.toISOString(),
        } as never,
      },
    });
    // eslint-disable-next-line no-console
    console.warn(
      `[content-approval-reminder] card=${c.id} tenant=${c.tenantId} title="${c.title}"`,
    );
  }
}
