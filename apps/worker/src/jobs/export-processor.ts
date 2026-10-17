import { prisma } from '@lmms/db';
import { processDataExport } from '@lmms/residency';

/**
 * Picks up data export requests that have been queued and processes them.
 * Runs every 5 minutes.
 */
export async function exportProcessorJob() {
  const pending = await prisma.dataExportRequest.findMany({
    where: { status: 'REQUESTED' },
    take: 10,
  });

  for (const req of pending) {
    try {
      const result = await processDataExport(req.id);
      // eslint-disable-next-line no-console
      console.log(`[export-processor] export=${req.id} status=${result.status}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[export-processor] export=${req.id} error`, e);
    }
  }
}
