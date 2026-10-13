import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import {
  assertTransition,
  type ProspectStatus,
} from './states';
import { getTemplate, renderTemplate } from './templates';
import { buildProposal, type ProposalInput } from './proposal';

type ProspectCategory =
  | 'HOTEL'
  | 'GYM'
  | 'SALON'
  | 'AIRBNB'
  | 'RESTAURANT'
  | 'OFFICE'
  | 'HOSPITAL'
  | 'SCHOOL'
  | 'OTHER';

type OutreachChannel = 'EMAIL' | 'WHATSAPP' | 'CALL' | 'LINKEDIN' | 'IN_PERSON';

export interface CreateProspectInput {
  tenantId: string;
  actorId: string;
  businessName: string;
  businessNameAr?: string;
  category: ProspectCategory;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  zone?: string;
  country: string;
  source?: string;
}

export async function createProspect(input: CreateProspectInput) {
  const prospect = await prisma.prospect.create({
    data: {
      tenantId: input.tenantId,
      businessName: input.businessName,
      businessNameAr: input.businessNameAr ?? null,
      category: input.category,
      contactName: input.contactName ?? null,
      contactPhone: input.contactPhone ?? null,
      contactEmail: input.contactEmail ?? null,
      zone: input.zone ?? null,
      country: input.country,
      source: input.source ?? 'MANUAL',
      createdBy: input.actorId,
    },
  });
  await logAudit(input.tenantId, input.actorId, 'prospect.create', `prospect:${prospect.id}`);
  return prospect;
}

export async function listProspects(opts: {
  tenantId: string;
  status?: string;
  category?: string;
  search?: string;
}) {
  const where: Record<string, unknown> = { tenantId: opts.tenantId };
  if (opts.status) where.status = opts.status;
  if (opts.category) where.category = opts.category;
  if (opts.search) {
    where.OR = [
      { businessName: { contains: opts.search, mode: 'insensitive' } },
      { contactName: { contains: opts.search, mode: 'insensitive' } },
      { contactEmail: { contains: opts.search, mode: 'insensitive' } },
    ];
  }
  return prisma.prospect.findMany({
    where,
    orderBy: [{ nextFollowUpAt: 'asc' }, { createdAt: 'desc' }],
    take: 500,
  });
}

export async function getProspect(tenantId: string, prospectId: string) {
  const p = await prisma.prospect.findUnique({
    where: { id: prospectId },
    include: {
      events: { orderBy: { occurredAt: 'desc' } },
      proposals: { orderBy: { version: 'desc' } },
      contracts: true,
    },
  });
  if (!p || p.tenantId !== tenantId) return null;
  return p;
}

export async function transitionProspect(opts: {
  tenantId: string;
  actorId: string;
  prospectId: string;
  to: ProspectStatus;
  notes?: string;
}) {
  const p = await prisma.prospect.findUnique({ where: { id: opts.prospectId } });
  if (!p || p.tenantId !== opts.tenantId) throw new Error('prospect_not_found');
  assertTransition(p.status as ProspectStatus, opts.to);

  const updated = await prisma.prospect.update({
    where: { id: opts.prospectId },
    data: {
      status: opts.to,
      lastContactAt: new Date(),
      ...(opts.notes ? { notes: opts.notes } : {}),
    },
  });
  await logAudit(
    opts.tenantId,
    opts.actorId,
    'prospect.transition',
    `prospect:${opts.prospectId}:${p.status}->${opts.to}`,
  );
  return updated;
}

export async function logOutreach(opts: {
  tenantId: string;
  actorId: string;
  prospectId: string;
  channel: OutreachChannel;
  direction: 'OUTBOUND' | 'INBOUND';
  templateKey?: string;
  subject?: string;
  body?: string;
  outcome?: string;
}) {
  const prospect = await prisma.prospect.findUnique({
    where: { id: opts.prospectId },
  });
  if (!prospect || prospect.tenantId !== opts.tenantId) {
    throw new Error('prospect_not_found');
  }

  let finalBody = opts.body;
  let finalSubject = opts.subject;
  if (opts.templateKey) {
    const tpl = getTemplate(opts.templateKey);
    if (tpl) {
      finalBody = renderTemplate(tpl.body, {
        business_name: prospect.businessName,
        contact_name: prospect.contactName ?? '',
        country: prospect.country,
        zone: prospect.zone ?? '',
      });
      finalSubject = tpl.subject ?? opts.subject;
    }
  }

  const event = await prisma.outreachEvent.create({
    data: {
      tenantId: opts.tenantId,
      prospectId: opts.prospectId,
      channel: opts.channel,
      direction: opts.direction,
      subject: finalSubject ?? null,
      body: finalBody ?? null,
      outcome: opts.outcome ?? null,
      templateKey: opts.templateKey ?? null,
      actorId: opts.actorId,
    },
  });

  await prisma.prospect.update({
    where: { id: opts.prospectId },
    data: {
      lastContactAt: new Date(),
      nextFollowUpAt: new Date(Date.now() + 3 * 86_400_000),
    },
  });

  await logAudit(
    opts.tenantId,
    opts.actorId,
    'prospect.outreach',
    `outreach:${event.id}`,
  );
  return event;
}

export async function createProposal(opts: {
  tenantId: string;
  actorId: string;
  prospectId: string;
  input: ProposalInput;
}) {
  const prospect = await prisma.prospect.findUnique({
    where: { id: opts.prospectId },
  });
  if (!prospect || prospect.tenantId !== opts.tenantId) {
    throw new Error('prospect_not_found');
  }

  const latest = await prisma.proposal.findFirst({
    where: { prospectId: opts.prospectId },
    orderBy: { version: 'desc' },
  });
  const nextVersion = (latest?.version ?? 0) + 1;

  const built = buildProposal(opts.input);

  const proposal = await prisma.proposal.create({
    data: {
      tenantId: opts.tenantId,
      prospectId: opts.prospectId,
      version: nextVersion,
      title: built.title,
      body: built.body,
      currency: built.currency,
      totalValue: built.totalValue,
      status: 'DRAFT',
      createdBy: opts.actorId,
    },
  });

  await logAudit(
    opts.tenantId,
    opts.actorId,
    'proposal.create',
    `proposal:${proposal.id}`,
  );
  return proposal;
}

export async function sendProposal(opts: {
  tenantId: string;
  actorId: string;
  proposalId: string;
}) {
  const updated = await prisma.proposal.update({
    where: { id: opts.proposalId },
    data: { status: 'SENT', sentAt: new Date() },
  });
  await logAudit(opts.tenantId, opts.actorId, 'proposal.send', `proposal:${opts.proposalId}`);
  return updated;
}

export async function decideProposal(opts: {
  tenantId: string;
  actorId: string;
  proposalId: string;
  decision: 'ACCEPTED' | 'REJECTED';
  reason?: string;
}) {
  const updated = await prisma.proposal.update({
    where: { id: opts.proposalId },
    data: {
      status: opts.decision,
      decidedAt: new Date(),
      rejectionReason: opts.decision === 'REJECTED' ? opts.reason ?? null : null,
    },
  });
  await logAudit(
    opts.tenantId,
    opts.actorId,
    `proposal.${opts.decision.toLowerCase()}`,
    `proposal:${opts.proposalId}`,
  );
  return updated;
}

export async function recordContract(opts: {
  tenantId: string;
  actorId: string;
  prospectId?: string;
  name: string;
  value: number;
  currency: string;
  signedDate: Date;
  startDate: Date;
  endDate?: Date;
  renewalDate?: Date;
  originatingCampaignId?: string;
  originatingAdCampaignId?: string;
  notes?: string;
}) {
  const contract = await prisma.contract.create({
    data: {
      tenantId: opts.tenantId,
      prospectId: opts.prospectId ?? null,
      name: opts.name,
      value: opts.value,
      currency: opts.currency,
      signedDate: opts.signedDate,
      startDate: opts.startDate,
      endDate: opts.endDate ?? null,
      renewalDate: opts.renewalDate ?? null,
      originatingCampaignId: opts.originatingCampaignId ?? null,
      originatingAdCampaignId: opts.originatingAdCampaignId ?? null,
      notes: opts.notes ?? null,
      createdBy: opts.actorId,
    },
  });
  await logAudit(
    opts.tenantId,
    opts.actorId,
    'contract.create',
    `contract:${contract.id}`,
  );
  return contract;
}

export async function listContracts(tenantId: string) {
  return prisma.contract.findMany({
    where: { tenantId },
    orderBy: { signedDate: 'desc' },
    take: 500,
  });
}

export async function pipelineStats(tenantId: string) {
  const grouped = await prisma.prospect.groupBy({
    by: ['status'],
    where: { tenantId },
    _count: { _all: true },
  });
  const contracts = await prisma.contract.aggregate({
    where: { tenantId, status: 'ACTIVE' },
    _count: { _all: true },
    _sum: { value: true },
  });
  return {
    prospectsByStatus: grouped.map((g) => ({
      status: g.status,
      count: g._count._all,
    })),
    activeContracts: contracts._count._all,
    activeContractValue: contracts._sum.value ? Number(contracts._sum.value) : 0,
  };
}

export async function dueFollowUps(tenantId: string, limit = 100) {
  const now = new Date();
  return prisma.prospect.findMany({
    where: {
      tenantId,
      status: { notIn: ['WON', 'LOST'] },
      nextFollowUpAt: { lte: now, not: null },
    },
    orderBy: { nextFollowUpAt: 'asc' },
    take: limit,
  });
}
