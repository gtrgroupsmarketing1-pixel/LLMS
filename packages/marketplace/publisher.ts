import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import type { MarketplaceCategory } from '@lmms/db';

export interface PublishTemplateInput {
  actorId: string;
  name: string;
  description?: string;
  category: MarketplaceCategory;
  sourceId: string; // ID of the WebsitePage, Journey, etc.
  sourceType: 'WEBSITE_PAGE' | 'JOURNEY' | 'CAMPAIGN';
}

export async function publishTemplate(input: PublishTemplateInput) {
  let payload: Record<string, unknown> = {};

  if (input.sourceType === 'WEBSITE_PAGE') {
    const page = await prisma.websitePage.findUnique({
      where: { id: input.sourceId },
      include: { website: true },
    });
    if (!page) throw new Error('source_page_not_found');

    payload = {
      titleEn: page.titleEn,
      titleAr: page.titleAr,
      blocks: page.blocks,
      seo: page.seo,
      theme: page.website.theme, // optional but nice
    };
  } else if (input.sourceType === 'JOURNEY') {
    const journey = await prisma.journey.findUnique({
      where: { id: input.sourceId },
    });
    if (!journey) throw new Error('source_journey_not_found');

    payload = {
      name: journey.name,
      nameAr: journey.nameAr,
      definition: journey.definition,
      priority: journey.priority,
      frequencyCapHours: journey.frequencyCapHours,
    };
  } else if (input.sourceType === 'CAMPAIGN') {
    const campaign = await prisma.campaign.findUnique({
      where: { id: input.sourceId },
    });
    if (!campaign) throw new Error('source_campaign_not_found');

    payload = {
      name: campaign.name,
      channel: campaign.channel,
      templateId: null, // We don't copy the exact template, just the structure
      // Note: In a real system, we'd need to deep-copy the template group too.
    };
  }

  const template = await prisma.marketplaceTemplate.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      category: input.category,
      status: 'PUBLISHED',
      payload: payload as never,
      authorId: input.actorId,
    },
  });

  await logAudit('agency', input.actorId, 'marketplace.publish', `template:${template.id}`);
  return template;
}
