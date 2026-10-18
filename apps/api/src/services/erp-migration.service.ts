import { prisma } from '@lmms/db';
import { ingestRawCsv, processImportJob, type ImportMappings } from '@lmms/erp-migration';

export async function uploadFile(tenantId: string, sourceSystem: string, fileBuffer: Buffer) {
  const jobId = await ingestRawCsv(tenantId, sourceSystem, fileBuffer);
  
  // Extract columns for the mapping UI
  const firstRow = await prisma.competitorImportRow.findFirst({
    where: { jobId },
  });
  const columns = firstRow ? Object.keys(firstRow.rawData as Record<string, unknown>) : [];

  return { jobId, columns };
}

export async function getJob(tenantId: string, jobId: string) {
  const job = await prisma.competitorImportJob.findUnique({
    where: { id: jobId },
    include: { rows: { take: 5 } },
  });
  if (!job || job.tenantId !== tenantId) return null;
  return job;
}

export async function startProcessing(tenantId: string, jobId: string, actorId: string, mappings: ImportMappings) {
  const job = await prisma.competitorImportJob.findUnique({
    where: { id: jobId },
  });
  if (!job || job.tenantId !== tenantId) throw new Error('job_not_found');

  // Note: In a real production app, we would queue this to the worker.
  // For V3.8, we'll process it synchronously in the API (it's already chunked).
  const result = await processImportJob(jobId, mappings, actorId);
  return result;
}
