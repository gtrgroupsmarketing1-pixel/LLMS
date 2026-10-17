import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';

export async function requestDataExport(tenantId: string, requestedBy: string) {
  return prisma.dataExportRequest.create({
    data: {
      tenantId,
      requestedBy,
      status: 'REQUESTED',
    },
  });
}

/**
 * Generates a JSON export of the tenant's data. 
 * WARNING: In a production environment with millions of rows, this
 * must be done asynchronously in a worker and uploaded to blob storage.
 * For V3.6, we do it inline and return a mock URL.
 */
export async function processDataExport(exportId: string) {
  const req = await prisma.dataExportRequest.findUnique({
    where: { id: exportId },
  });
  if (!req) throw new Error('export_request_not_found');
  if (req.status !== 'REQUESTED') return req;

  await prisma.dataExportRequest.update({
    where: { id: exportId },
    data: { status: 'PROCESSING' },
  });

  try {
    const tenantId = req.tenantId;

    const [tenant, users, customers, campaigns, messages] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.user.findMany({ where: { tenantId } }),
      prisma.endCustomer.findMany({ where: { tenantId } }),
      prisma.campaign.findMany({ where: { tenantId } }),
      prisma.message.findMany({ where: { tenantId }, take: 10000 }), // Cap for sanity
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      tenant,
      users,
      customers,
      campaigns,
      messages,
    };

    // Simulate generating a download URL (in prod this would be an S3 presigned URL)
    const mockUrl = `https://storage.lmms.internal/exports/${tenantId}/${exportId}.json`;
    const expiresAt = new Date(Date.now() + 7 * 86_400_000); // 7 days

    const updated = await prisma.dataExportRequest.update({
      where: { id: exportId },
      data: {
        status: 'COMPLETED',
        downloadUrl: mockUrl,
        expiresAt,
      },
    });

    await logAudit(tenantId, req.requestedBy, 'data_export.complete', `export:${exportId}`);
    return updated;

  } catch (e) {
    await prisma.dataExportRequest.update({
      where: { id: exportId },
      data: {
        status: 'FAILED',
        failureReason: (e as Error).message,
      },
    });
    throw e;
  }
}
