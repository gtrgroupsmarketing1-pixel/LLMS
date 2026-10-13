import { prisma } from '@lmms/db';
import { syncSpendForTenant } from '@lmms/ads';

export async function adsSpendSyncJob() {
  const tenants = await prisma.tenant.findMany({ where: { status: 'ACTIVE' } });
  for (const t of tenants) {
    try {
      const result = await syncSpendForTenant(t.id);
      if (result.snapshotsWritten > 0) {
        // eslint-disable-next-line no-console
        console.log(
          `[ads-spend-sync] tenant=${t.id} snapshots=${result.snapshotsWritten}`,
        );
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[ads-spend-sync] tenant=${t.id} error`, e);
    }
  }
}
