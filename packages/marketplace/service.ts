import { prisma } from '@lmms/db';

export async function listTemplates(category?: string) {
  return prisma.marketplaceTemplate.findMany({
    where: {
      status: 'PUBLISHED',
      ...(category ? { category: category as never } : {}),
    },
    orderBy: { installCount: 'desc' },
  });
}

export async function getTemplate(templateId: string) {
  return prisma.marketplaceTemplate.findUnique({
    where: { id: templateId },
  });
}

export async function listTenantInstalls(tenantId: string) {
  return prisma.templateInstall.findMany({
    where: { tenantId },
    include: { template: true },
    orderBy: { createdAt: 'desc' },
  });
}
