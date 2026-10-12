import { prisma } from '@lmms/db';

export async function migrationWatchdogJob() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const stuck = await prisma.migrationJob.findMany({
    where: { status: 'AWAITING_REVIEW', startedAt: { lt: cutoff } },
  });
  for (const j of stuck) {
    // eslint-disable-next-line no-console
    console.warn(
      `[migration-watchdog] job=${j.id} tenant=${j.tenantId} awaiting review since ${j.startedAt.toISOString()}`,
    );
  }
}
