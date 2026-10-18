import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import { assertValidBlocks } from '@lmms/website';
import { assertGraphValid } from '@lmms/journey-builder';

export interface InstallTemplateInput {
  tenantId: string;
  actorId: string;
  templateId: string;
}

export async function installTemplate(input: InstallTemplateInput) {
  const template = await prisma.marketplaceTemplate.findUnique({
    where: { id: input.templateId },
  });
  if (!template || template.status !== 'PUBLISHED') {
    throw new Error('template_not_found_or_unpublished');
  }

  const alreadyInstalled = await prisma.templateInstall.findUnique({
    where: {
      tenantId_templateId: {
        tenantId: input.tenantId,
        templateId: input.templateId,
      },
    },
  });
  // We allow re-installation (e.g., to get updates), but we track it.

  let targetId = '';

  if (template.category === 'WEBSITE_PAGE') {
    // 1. Get or create the website for the tenant
    let website = await prisma.website.findUnique({
      where: { tenantId: input.tenantId },
    });
    if (!website) {
      // If they don't have one, create a placeholder subdomain
      website = await prisma.website.create({
        data: {
          tenantId: input.tenantId,
          subdomain: `site-${input.tenantId.slice(0, 8)}`,
          status: 'DRAFT',
          createdBy: input.actorId,
        },
      });
    }

    const payload = template.payload as Record<string, unknown>;
    // Validate blocks before saving
    const validatedBlocks = assertValidBlocks(payload.blocks);

    // 2. Create the page
    const page = await prisma.websitePage.create({
      data: {
        tenantId: input.tenantId,
        websiteId: website.id,
        slug: `template-${Date.now().toString().slice(-4)}`, // unique slug
        titleEn: String(payload.titleEn ?? 'Imported Page'),
        titleAr: payload.titleAr ? String(payload.titleAr) : null,
        blocks: validatedBlocks as never,
        seo: (payload.seo ?? null) as never,
        status: 'DRAFT',
      },
    });
    targetId = page.id;

  } else if (template.category === 'JOURNEY') {
    const payload = template.payload as Record<string, unknown>;
    const definition = assertGraphValid(payload.definition);

    const journey = await prisma.journey.create({
      data: {
        tenantId: input.tenantId,
        name: `${String(payload.name ?? 'Imported')} (Copy)`,
        nameAr: payload.nameAr ? String(payload.nameAr) : null,
        status: 'DRAFT',
        priority: Number(payload.priority ?? 100),
        frequencyCapHours: Number(payload.frequencyCapHours ?? 24),
        definition: definition as never,
        createdBy: input.actorId,
      },
    });
    targetId = journey.id;
  } else {
    throw new Error('unsupported_category');
  }

  // 3. Record install and increment count
  await prisma.$transaction([
    prisma.templateInstall.upsert({
      where: {
        tenantId_templateId: {
          tenantId: input.tenantId,
          templateId: input.templateId,
        },
      },
      update: {},
      create: {
        tenantId: input.tenantId,
        templateId: input.templateId,
        installedBy: input.actorId,
      },
    }),
    prisma.marketplaceTemplate.update({
      where: { id: input.templateId },
      data: { installCount: { increment: 1 } },
    }),
  ]);

  await logAudit(input.tenantId, input.actorId, 'marketplace.install', `template:${input.templateId}`);

  return { targetId };
}
