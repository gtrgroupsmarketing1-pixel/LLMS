import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import { assertValidBlocks, captureLead, trackVisit } from '@lmms/website/server';

export async function getOrCreateWebsite(tenantId: string, actorId: string) {
  const existing = await prisma.website.findUnique({ where: { tenantId } });
  if (existing) return existing;

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  const baseSlug = tenant.nameEn
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
  let subdomain = baseSlug;
  let attempt = 1;
  while (await prisma.website.findUnique({ where: { subdomain } })) {
    subdomain = `${baseSlug}${attempt}`;
    attempt += 1;
  }

  const website = await prisma.website.create({
    data: {
      tenantId,
      subdomain,
      status: 'DRAFT',
      createdBy: actorId,
    },
  });

  await logAudit(tenantId, actorId, 'website.create', `website:${website.id}`);
  return website;
}

export async function updateWebsite(opts: {
  tenantId: string;
  actorId: string;
  patch: { subdomain?: string; customDomain?: string | null; theme?: unknown; seoDefaults?: unknown };
}) {
  const website = await prisma.website.findUnique({ where: { tenantId: opts.tenantId } });
  if (!website) throw new Error('website_not_found');

  const updated = await prisma.website.update({
    where: { id: website.id },
    data: {
      ...(opts.patch.subdomain ? { subdomain: opts.patch.subdomain } : {}),
      ...(opts.patch.customDomain !== undefined
        ? { customDomain: opts.patch.customDomain }
        : {}),
      ...(opts.patch.theme !== undefined ? { theme: opts.patch.theme as never } : {}),
      ...(opts.patch.seoDefaults !== undefined
        ? { seoDefaults: opts.patch.seoDefaults as never }
        : {}),
    },
  });

  await logAudit(opts.tenantId, opts.actorId, 'website.update', `website:${website.id}`);
  return updated;
}

export async function publishWebsite(tenantId: string, actorId: string) {
  const website = await prisma.website.findUnique({ where: { tenantId } });
  if (!website) throw new Error('website_not_found');

  const published = await prisma.website.update({
    where: { id: website.id },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  });

  await logAudit(tenantId, actorId, 'website.publish', `website:${website.id}`);
  return published;
}

export async function listPages(tenantId: string) {
  const website = await prisma.website.findUnique({ where: { tenantId } });
  if (!website) return [];
  return prisma.websitePage.findMany({
    where: { websiteId: website.id },
    orderBy: [{ slug: 'asc' }],
  });
}

export async function createPage(opts: {
  tenantId: string;
  actorId: string;
  slug: string;
  titleEn: string;
  titleAr?: string;
  blocks: unknown;
  seo?: unknown;
}) {
  const website = await prisma.website.findUnique({ where: { tenantId: opts.tenantId } });
  if (!website) throw new Error('website_not_found');

  const validatedBlocks = assertValidBlocks(opts.blocks);

  const page = await prisma.websitePage.create({
    data: {
      tenantId: opts.tenantId,
      websiteId: website.id,
      slug: opts.slug,
      titleEn: opts.titleEn,
      titleAr: opts.titleAr ?? null,
      blocks: validatedBlocks as never,
      seo: (opts.seo ?? null) as never,
      status: 'DRAFT',
    },
  });

  await logAudit(opts.tenantId, opts.actorId, 'website_page.create', `page:${page.id}`);
  return page;
}

export async function updatePage(opts: {
  tenantId: string;
  actorId: string;
  pageId: string;
  patch: { titleEn?: string; titleAr?: string; blocks?: unknown; seo?: unknown };
}) {
  const page = await prisma.websitePage.findUnique({ where: { id: opts.pageId } });
  if (!page || page.tenantId !== opts.tenantId) throw new Error('page_not_found');

  let validatedBlocks: unknown = undefined;
  if (opts.patch.blocks !== undefined) {
    validatedBlocks = assertValidBlocks(opts.patch.blocks);
  }

  const updated = await prisma.websitePage.update({
    where: { id: opts.pageId },
    data: {
      ...(opts.patch.titleEn ? { titleEn: opts.patch.titleEn } : {}),
      ...(opts.patch.titleAr !== undefined ? { titleAr: opts.patch.titleAr } : {}),
      ...(validatedBlocks !== undefined ? { blocks: validatedBlocks as never } : {}),
      ...(opts.patch.seo !== undefined ? { seo: opts.patch.seo as never } : {}),
    },
  });

  await logAudit(opts.tenantId, opts.actorId, 'website_page.update', `page:${opts.pageId}`);
  return updated;
}

export async function publishPage(tenantId: string, actorId: string, pageId: string) {
  const page = await prisma.websitePage.findUnique({ where: { id: pageId } });
  if (!page || page.tenantId !== tenantId) throw new Error('page_not_found');

  const updated = await prisma.websitePage.update({
    where: { id: pageId },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  });
  await logAudit(tenantId, actorId, 'website_page.publish', `page:${pageId}`);
  return updated;
}

export async function getPageBySubdomain(subdomain: string, slug: string) {
  const website = await prisma.website.findUnique({ where: { subdomain } });
  if (!website || website.status !== 'PUBLISHED') return null;

  const page = await prisma.websitePage.findUnique({
    where: { websiteId_slug: { websiteId: website.id, slug } },
  });
  if (!page || page.status !== 'PUBLISHED') return null;

  return { website, page };
}

export async function getHomePage(subdomain: string) {
  const website = await prisma.website.findUnique({ where: { subdomain } });
  if (!website || website.status !== 'PUBLISHED') return null;

  const page = await prisma.websitePage.findUnique({
    where: { websiteId_slug: { websiteId: website.id, slug: 'home' } },
  });
  if (!page || page.status !== 'PUBLISHED') return null;

  return { website, page };
}

export async function submitLead(opts: {
  subdomain: string;
  pageSlug: string;
  name?: string;
  phone?: string;
  email?: string;
  zone?: string;
  message?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  promoCode?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const website = await prisma.website.findUnique({ where: { subdomain: opts.subdomain } });
  if (!website) throw new Error('website_not_found');

  const page = await prisma.websitePage.findFirst({
    where: { websiteId: website.id, slug: opts.pageSlug },
  });

  return captureLead({
    tenantId: website.tenantId,
    websiteId: website.id,
    pageId: page?.id,
    name: opts.name,
    phone: opts.phone,
    email: opts.email,
    zone: opts.zone,
    message: opts.message,
    utmSource: opts.utmSource,
    utmMedium: opts.utmMedium,
    utmCampaign: opts.utmCampaign,
    promoCode: opts.promoCode,
    ipAddress: opts.ipAddress,
    userAgent: opts.userAgent,
  });
}

export async function recordVisit(opts: {
  subdomain: string;
  pageSlug: string;
  path: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}) {
  const website = await prisma.website.findUnique({ where: { subdomain: opts.subdomain } });
  if (!website) return null;
  const page = await prisma.websitePage.findFirst({
    where: { websiteId: website.id, slug: opts.pageSlug },
  });
  if (!page) return null;
  return trackVisit({
    tenantId: website.tenantId,
    websiteId: website.id,
    pageId: page.id,
    path: opts.path,
    referrer: opts.referrer,
    utmSource: opts.utmSource,
    utmMedium: opts.utmMedium,
    utmCampaign: opts.utmCampaign,
  });
}
