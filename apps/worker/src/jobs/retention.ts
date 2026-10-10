import { prisma } from '@lmms/db';
import { applyRetentionPolicy } from '@lmms/compliance';

export async function retentionJob() {
  const tenants = await prisma.tenant.findMany({ where: { status: 'ACTIVE' } });
  for (const t of tenants) {
    try {
      const r = await applyRetentionPolicy(t.id);
      // eslint-disable-next-line no-console
      console.log(
        `[retention] tenant=${t.id} consent=${r.deletedConsent} marketing=${r.deletedMarketing} tx=${r.deletedTransaction}`,
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[retention] tenant=${t.id} error`, e);
    }
  }
}
