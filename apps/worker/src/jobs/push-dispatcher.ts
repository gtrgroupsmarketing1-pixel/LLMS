import { prisma } from '@lmms/db';
import { dispatchPush } from '@lmms/push';

/**
 * Retries notifications that failed or remained queued. Runs every minute.
 * Skips notifications older than 24h to avoid infinite retry storms.
 */
export async function pushDispatcherJob() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const stuck = await prisma.pushNotification.findMany({
    where: {
      status: 'QUEUED',
      createdAt: { gte: cutoff },
    },
    take: 100,
  });

  for (const n of stuck) {
    try {
      await dispatchPush({
        userId: n.userId,
        tenantId: n.tenantId ?? undefined,
        kind: n.kind as never,
        title: n.title,
        body: n.body,
        data: (n.data ?? undefined) as never,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[push-dispatcher] notification=${n.id} error`, e);
    }
  }
}
