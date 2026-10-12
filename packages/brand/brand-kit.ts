import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';

export interface BrandKitInput {
  tagline?: string | null;
  taglineAr?: string | null;
  tone?: string | null;
  toneAr?: string | null;
  logoVariants?: Record<string, string> | null;
  colors?: Array<{ name: string; hex: string }> | null;
  fonts?: Array<{ name: string; script: 'arabic' | 'latin' | 'both' }> | null;
}

export async function upsertBrandKit(opts: {
  tenantId: string;
  actorId: string;
  input: BrandKitInput;
}) {
  const existing = await prisma.brandKit.findUnique({
    where: { tenantId: opts.tenantId },
  });

  const data = {
    tagline: opts.input.tagline ?? null,
    taglineAr: opts.input.taglineAr ?? null,
    tone: opts.input.tone ?? null,
    toneAr: opts.input.toneAr ?? null,
    logoVariants: (opts.input.logoVariants ?? null) as never,
    colors: (opts.input.colors ?? null) as never,
    fonts: (opts.input.fonts ?? null) as never,
  };

  const kit = existing
    ? await prisma.brandKit.update({ where: { id: existing.id }, data })
    : await prisma.brandKit.create({
        data: { tenantId: opts.tenantId, createdBy: opts.actorId, ...data },
      });

  await logAudit(
    opts.tenantId,
    opts.actorId,
    existing ? 'brand_kit.update' : 'brand_kit.create',
    `brand_kit:${kit.id}`,
  );
  return kit;
}

export async function getBrandKit(tenantId: string) {
  return prisma.brandKit.findUnique({ where: { tenantId } });
}

export async function submitForClientReview(
  tenantId: string,
  actorId: string,
) {
  const kit = await prisma.brandKit.findUnique({ where: { tenantId } });
  if (!kit) throw new Error('brand_kit_not_found');
  const updated = await prisma.brandKit.update({
    where: { id: kit.id },
    data: { status: 'CLIENT_REVIEW' },
  });
  await logAudit(tenantId, actorId, 'brand_kit.submit', `brand_kit:${kit.id}`);
  return updated;
}

export async function approveBrandKit(
  tenantId: string,
  actorId: string,
) {
  const kit = await prisma.brandKit.findUnique({ where: { tenantId } });
  if (!kit) throw new Error('brand_kit_not_found');
  if (kit.status !== 'CLIENT_REVIEW') throw new Error('not_in_client_review');
  const updated = await prisma.brandKit.update({
    where: { id: kit.id },
    data: { status: 'APPROVED', approvedAt: new Date() },
  });
  await logAudit(tenantId, actorId, 'brand_kit.approve', `brand_kit:${kit.id}`);
  return updated;
}
