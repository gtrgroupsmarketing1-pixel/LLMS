import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import { assertTransition, type CardStatus } from './transitions';
import {
  generateApprovalToken,
  hashApprovalToken,
  isExpired,
} from './approval-token';
import { bilingualCopy } from './rtl';

type Channel =
  | 'WHATSAPP'
  | 'SMS'
  | 'EMAIL'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'GOOGLE_BUSINESS'
  | 'PRINT'
  | 'IN_STORE';

export interface CreateCardInput {
  tenantId: string;
  actorId: string;
  title: string;
  brief?: string;
  copyAr?: string;
  copyEn?: string;
  channel: Channel;
  scheduledAt?: Date;
  ownerId?: string;
}

function snapshot(card: {
  title: string;
  brief: string | null;
  copyAr: string | null;
  copyEn: string | null;
  channel: string;
  scheduledAt: Date | null;
}) {
  return {
    title: card.title,
    brief: card.brief,
    copyAr: card.copyAr,
    copyEn: card.copyEn,
    channel: card.channel,
    scheduledAt: card.scheduledAt?.toISOString() ?? null,
  };
}

export async function createCard(input: CreateCardInput) {
  const card = await prisma.contentCard.create({
    data: {
      tenantId: input.tenantId,
      title: input.title,
      brief: input.brief ?? null,
      copyAr: input.copyAr ?? null,
      copyEn: input.copyEn ?? null,
      channel: input.channel,
      scheduledAt: input.scheduledAt,
      ownerId: input.ownerId ?? null,
      status: 'DRAFT',
      createdBy: input.actorId,
      currentVersion: 1,
    },
  });

  await prisma.contentCardVersion.create({
    data: {
      cardId: card.id,
      tenantId: input.tenantId,
      version: 1,
      snapshot: snapshot(card) as never,
      changedBy: input.actorId,
      changeNote: 'created',
    },
  });

  await logAudit(input.tenantId, input.actorId, 'content_card.create', `card:${card.id}`);
  return card;
}

export interface UpdateCardInput {
  tenantId: string;
  actorId: string;
  cardId: string;
  patch: Partial<{
    title: string;
    brief: string | null;
    copyAr: string | null;
    copyEn: string | null;
    channel: Channel;
    scheduledAt: Date | null;
    ownerId: string | null;
  }>;
  changeNote?: string;
}

export async function updateCard(input: UpdateCardInput) {
  const existing = await prisma.contentCard.findUnique({
    where: { id: input.cardId },
  });
  if (!existing || existing.tenantId !== input.tenantId) {
    throw new Error('card_not_found');
  }
  if (existing.status === 'LIVE' || existing.status === 'COMPLETED') {
    throw new Error('card_locked');
  }
  const nextVersion = existing.currentVersion + 1;
  const updated = await prisma.contentCard.update({
    where: { id: input.cardId },
    data: { ...input.patch, currentVersion: nextVersion },
  });
  await prisma.contentCardVersion.create({
    data: {
      cardId: updated.id,
      tenantId: input.tenantId,
      version: nextVersion,
      snapshot: snapshot(updated) as never,
      changedBy: input.actorId,
      changeNote: input.changeNote ?? 'updated',
    },
  });
  await logAudit(input.tenantId, input.actorId, 'content_card.update', `card:${updated.id}`);
  return updated;
}

export interface TransitionInput {
  tenantId: string;
  actorId: string;
  cardId: string;
  to: CardStatus;
  reason?: string;
}

export async function transitionCard(input: TransitionInput) {
  const card = await prisma.contentCard.findUnique({ where: { id: input.cardId } });
  if (!card || card.tenantId !== input.tenantId) throw new Error('card_not_found');

  assertTransition(card.status as CardStatus, input.to);

  const patch: Record<string, unknown> = { status: input.to };
  if (input.to === 'LIVE') patch.publishedAt = new Date();
  if ((input.to === 'REJECTED' || input.to === 'DRAFT') && input.reason !== undefined) {
    patch.rejectionReason = input.reason;
  }

  const updated = await prisma.contentCard.update({
    where: { id: input.cardId },
    data: patch,
  });

  await logAudit(
    input.tenantId,
    input.actorId,
    'content_card.transition',
    `card:${card.id}:${card.status}->${input.to}`,
  );
  return updated;
}

export async function sendForClientReview(input: {
  tenantId: string;
  actorId: string;
  cardId: string;
  baseApprovalUrl: string;
}) {
  const card = await prisma.contentCard.findUnique({ where: { id: input.cardId } });
  if (!card || card.tenantId !== input.tenantId) throw new Error('card_not_found');
  assertTransition(card.status as CardStatus, 'CLIENT_REVIEW');

  const token = generateApprovalToken();
  await prisma.contentApprovalLink.create({
    data: {
      cardId: card.id,
      tenantId: input.tenantId,
      tokenHash: token.hash,
      expiresAt: token.expiresAt,
    },
  });

  const updated = await prisma.contentCard.update({
    where: { id: card.id },
    data: { status: 'CLIENT_REVIEW' },
  });

  await logAudit(
    input.tenantId,
    input.actorId,
    'content_card.send_for_review',
    `card:${card.id}`,
  );

  const approvalUrl = `${input.baseApprovalUrl.replace(/\/$/, '')}/approve/${token.raw}`;
  return { card: updated, approvalUrl, expiresAt: token.expiresAt };
}

export interface ConsumeApprovalInput {
  rawToken: string;
  decision: 'APPROVE' | 'REJECT';
  reason?: string;
}

export async function consumeApprovalToken(input: ConsumeApprovalInput) {
  const tokenHash = hashApprovalToken(input.rawToken);
  const link = await prisma.contentApprovalLink.findUnique({ where: { tokenHash } });
  if (!link) throw new Error('token_not_found');
  if (link.usedAt) throw new Error('token_already_used');
  if (isExpired(link.expiresAt)) throw new Error('token_expired');

  const card = await prisma.contentCard.findUnique({ where: { id: link.cardId } });
  if (!card) throw new Error('card_not_found');
  if (card.status !== 'CLIENT_REVIEW') throw new Error('card_not_in_client_review');

  const nextStatus: CardStatus = input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  assertTransition(card.status as CardStatus, nextStatus);

  const [updatedCard] = await prisma.$transaction([
    prisma.contentCard.update({
      where: { id: card.id },
      data: {
        status: nextStatus,
        rejectionReason: input.decision === 'REJECT' ? input.reason ?? null : null,
      },
    }),
    prisma.contentApprovalLink.update({
      where: { id: link.id },
      data: {
        usedAt: new Date(),
        decision: input.decision,
        reason: input.reason ?? null,
      },
    }),
  ]);

  await logAudit(
    card.tenantId,
    'client_one_tap',
    'content_card.approval_decision',
    `card:${card.id}:${input.decision}`,
  );
  return updatedCard;
}

export async function getApprovalByToken(rawToken: string) {
  const tokenHash = hashApprovalToken(rawToken);
  const link = await prisma.contentApprovalLink.findUnique({
    where: { tokenHash },
    include: { card: true },
  });
  if (!link) return null;
  const expired = isExpired(link.expiresAt);
  const copy = bilingualCopy(link.card.copyAr, link.card.copyEn);
  return {
    card: link.card,
    copy,
    expired,
    used: !!link.usedAt,
    decision: link.decision,
    expiresAt: link.expiresAt,
  };
}

export async function addComment(input: {
  tenantId: string;
  actorId: string;
  authorKind: 'AGENCY' | 'CLIENT';
  cardId: string;
  body: string;
}) {
  const comment = await prisma.contentCardComment.create({
    data: {
      cardId: input.cardId,
      tenantId: input.tenantId,
      authorId: input.actorId,
      authorKind: input.authorKind,
      body: input.body,
    },
  });
  await logAudit(input.tenantId, input.actorId, 'content_card.comment', `card:${input.cardId}`);
  return comment;
}

export async function listCalendar(input: {
  tenantId: string;
  from: Date;
  to: Date;
  channel?: Channel;
  status?: CardStatus;
}) {
  const where: Record<string, unknown> = {
    tenantId: input.tenantId,
    OR: [
      { scheduledAt: { gte: input.from, lte: input.to } },
      { scheduledAt: null, createdAt: { gte: input.from, lte: input.to } },
    ],
  };
  if (input.channel) where.channel = input.channel;
  if (input.status) where.status = input.status;

  const cards = await prisma.contentCard.findMany({
    where,
    orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
    take: 500,
  });

  return cards.map((c) => ({
    ...c,
    copy: bilingualCopy(c.copyAr, c.copyEn),
  }));
}

export async function getCard(tenantId: string, cardId: string) {
  const card = await prisma.contentCard.findUnique({ where: { id: cardId } });
  if (!card || card.tenantId !== tenantId) return null;
  const [versions, comments, approvals] = await Promise.all([
    prisma.contentCardVersion.findMany({
      where: { cardId },
      orderBy: { version: 'desc' },
    }),
    prisma.contentCardComment.findMany({
      where: { cardId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.contentApprovalLink.findMany({
      where: { cardId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  return {
    ...card,
    copy: bilingualCopy(card.copyAr, card.copyEn),
    versions,
    comments,
    approvals: approvals.map((a) => ({
      id: a.id,
      tenantId: a.tenantId,
      cardId: a.cardId,
      expiresAt: a.expiresAt,
      usedAt: a.usedAt,
      decision: a.decision,
      reason: a.reason,
      createdAt: a.createdAt,
    })),
  };
}

export async function seedGccTemplates() {
  const { GCC_TEMPLATE_LIBRARY } = await import('./templates');
  let upserted = 0;
  for (const t of GCC_TEMPLATE_LIBRARY) {
    await prisma.gccTemplate.upsert({
      where: { slug: t.slug },
      update: {
        titleEn: t.titleEn,
        titleAr: t.titleAr,
        occasion: t.occasion,
        country: t.country,
        channel: t.channel,
        briefEn: t.briefEn,
        briefAr: t.briefAr,
        suggestedCopyEn: t.suggestedCopyEn,
        suggestedCopyAr: t.suggestedCopyAr,
      },
      create: {
        slug: t.slug,
        titleEn: t.titleEn,
        titleAr: t.titleAr,
        occasion: t.occasion,
        country: t.country,
        channel: t.channel,
        briefEn: t.briefEn,
        briefAr: t.briefAr,
        suggestedCopyEn: t.suggestedCopyEn,
        suggestedCopyAr: t.suggestedCopyAr,
      },
    });
    upserted += 1;
  }
  return upserted;
}

export async function listGccTemplates(opts: {
  country?: string;
  channel?: string;
  occasion?: string;
}) {
  const where: Record<string, unknown> = { active: true };
  if (opts.occasion) where.occasion = opts.occasion;
  if (opts.channel) where.channel = opts.channel;
  if (opts.country) {
    where.OR = [{ country: null }, { country: opts.country }];
  }
  return prisma.gccTemplate.findMany({ where, orderBy: { occasion: 'asc' } });
}
