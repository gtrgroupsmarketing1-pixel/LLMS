import { prisma } from '@lmms/db';

export interface ProcessingActivityInput {
  tenantId?: string;
  name: string;
  purpose: string;
  dataCategories: string[];
  legalBasis: string;
  retentionDays: number;
}

export async function createProcessingActivity(input: ProcessingActivityInput) {
  return prisma.processingActivity.create({
    data: {
      tenantId: input.tenantId ?? null,
      name: input.name,
      purpose: input.purpose,
      dataCategories: input.dataCategories as never,
      legalBasis: input.legalBasis,
      retentionDays: input.retentionDays,
    },
  });
}

export async function listProcessingActivities(tenantId?: string) {
  return prisma.processingActivity.findMany({
    where: {
      OR: [
        { tenantId: null },
        ...(tenantId ? [{ tenantId }] : []),
      ],
    },
    orderBy: { name: 'asc' },
  });
}
