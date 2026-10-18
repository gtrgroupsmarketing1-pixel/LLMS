import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import { normalizePhone } from '@lmms/ingestion';
import { mapRow, type ImportMappings } from './mapper';

export async function processImportJob(
  jobId: string,
  mappings: ImportMappings,
  actorId: string,
) {
  const job = await prisma.competitorImportJob.findUnique({
    where: { id: jobId },
  });
  if (!job) throw new Error('job_not_found');
  if (job.status === 'COMPLETED' || job.status === 'IMPORTING') {
    throw new Error('job_already_processing');
  }

  await prisma.competitorImportJob.update({
    where: { id: jobId },
    data: { status: 'IMPORTING', mappings: mappings as never },
  });

  const rows = await prisma.competitorImportRow.findMany({
    where: { jobId, status: 'PENDING' },
  });

  let success = 0;
  let failed = 0;

  for (const row of rows) {
    const raw = row.rawData as Record<string, unknown>;
    const { data, errors } = mapRow(raw, mappings);

    if (errors.length > 0) {
      await prisma.competitorImportRow.update({
        where: { id: row.id },
        data: { status: 'ERROR', errors: errors as never },
      });
      failed++;
      continue;
    }

    const normalizedPhone = normalizePhone(data.phone);
    if (!normalizedPhone) {
      await prisma.competitorImportRow.update({
        where: { id: row.id },
        data: { status: 'ERROR', errors: { error: 'invalid_phone_format' } as never },
      });
      failed++;
      continue;
    }

    try {
      // 1. Create or find the customer
      let customer = await prisma.endCustomer.findFirst({
        where: { tenantId: job.tenantId, phone: normalizedPhone },
      });

      if (!customer) {
        customer = await prisma.endCustomer.create({
          data: {
            tenantId: job.tenantId,
            phone: normalizedPhone,
            email: data.email ?? null,
            name: data.name ?? null,
            zone: data.zone ?? null,
            language: 'ar',
            source: `MIGRATION_${job.sourceSystem}`,
            consentVerified: false, // Competitor imports cannot assume consent
            needsReview: true,
          },
        });
      }

      // 2. Create the order if provided
      if (data.order) {
        await prisma.order.create({
          data: {
            tenantId: job.tenantId,
            customerId: customer.id,
            orderDate: data.order.orderDate,
            amount: data.order.amount,
            status: data.order.status,
            serviceType: data.order.serviceType ?? null,
            currency: 'AED', // Default, ideally mapped or from tenant profile
          },
        });
      }

      await prisma.competitorImportRow.update({
        where: { id: row.id },
        data: { status: 'SUCCESS' },
      });
      success++;
    } catch (e) {
      await prisma.competitorImportRow.update({
        where: { id: row.id },
        data: { status: 'ERROR', errors: { error: (e as Error).message } as never },
      });
      failed++;
    }
  }

  const finalJob = await prisma.competitorImportJob.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETED',
      successRows: success,
      errorRows: failed,
    },
  });

  await logAudit(job.tenantId, actorId, 'erp_migration.complete', `job:${jobId}`);
  return finalJob;
}
