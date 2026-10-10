import { prisma } from '@lmms/db';
import { verifyAuditChain } from '@lmms/audit';

export async function auditIntegrityJob() {
  const tenants = await prisma.tenant.findMany({ where: { status: 'ACTIVE' } });
  for (const t of tenants) {
    const result = await verifyAuditChain(t.id);
    if (!result.valid) {
      // eslint-disable-next-line no-console
      console.error(`[audit-integrity] BROKEN tenant=${t.id} at=${result.brokenAt}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`[audit-integrity] tenant=${t.id} ok`);
    }
  }
}
