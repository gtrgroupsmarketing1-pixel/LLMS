import { prisma } from '@lmms/db';
import { runErpSync, MockErpAdapter } from '@lmms/ingestion';

export async function erpSyncJob() {
  const tenants = await prisma.tenant.findMany({
    where: { mode: 'ERP_CONNECTED' },
  });
  for (const t of tenants) {
    try {
      const result = await runErpSync(t.id, new MockErpAdapter(), 'system');
      // eslint-disable-next-line no-console
      console.log(`[erp-sync] tenant=${t.id} status=${result.status}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[erp-sync] tenant=${t.id} error`, e);
    }
  }
}
