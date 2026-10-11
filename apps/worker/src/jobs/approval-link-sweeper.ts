import { prisma } from '@lmms/db';

export async function approvalLinkSweeperJob() {
  const now = new Date();
  const expired = await prisma.contentApprovalLink.findMany({
    where: { usedAt: null, expiresAt: { lte: now } },
    take: 500,
  });
  for (const l of expired) {
    // eslint-disable-next-line no-console
    console.warn(
      `[approval-link] expired card=${l.cardId} link=${l.id}`,
    );
  }
}
