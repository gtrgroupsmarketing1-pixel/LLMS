import { prisma } from '@lmms/db';
import { createErpAdapterForTenant, runErpSync } from '@lmms/ingestion';

export async function erpSyncJob() {
  const tenants = await prisma.tenant.findMany({ where: { mode: 'ERP_CONNECTED' } });
  
  for (const t of tenants) {
    try {
      const adapter = await createErpAdapterForTenant(t.id);
      const result = await runErpSync(t.id, adapter, 'system');
      console.log(`[erp-sync] tenant=${t.id} status=${result.status}`);
    } catch (e) {
      console.error(`[erp-sync] tenant=${t.id} error`, e);
    }
  }
}
