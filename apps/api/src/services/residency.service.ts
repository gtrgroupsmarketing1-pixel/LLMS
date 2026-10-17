import { prisma } from '@lmms/db';
import * as residency from '@lmms/residency';

export { residency };

export async function updateTenantRegion(
  tenantId: string,
  region: 'UAE' | 'KSA',
  actorId: string,
) {
  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: { region },
  });
  await residency.processDataExport; // dummy to ensure import is used if needed
  return updated;
}

export async function listExports(tenantId: string) {
  return prisma.dataExportRequest.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}
