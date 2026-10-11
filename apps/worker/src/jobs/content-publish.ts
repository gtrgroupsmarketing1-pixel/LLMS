import { prisma } from '@lmms/db';
import { transitionCard } from '@lmms/content-calendar';

export async function contentPublishJob() {
  const due = await prisma.contentCard.findMany({
    where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
    take: 200,
  });
  for (const c of due) {
    try {
      await transitionCard({
        tenantId: c.tenantId,
        actorId: 'system',
        cardId: c.id,
        to: 'LIVE',
      });
      // eslint-disable-next-line no-console
      console.log(`[content-publish] card=${c.id} -> LIVE`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[content-publish] card=${c.id} error`, e);
    }
  }
}
