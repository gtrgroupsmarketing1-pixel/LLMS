import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import { assertConsent } from '@lmms/compliance';
import { MockWhatsAppAdapter, renderTemplate, type WhatsAppAdapter } from '@lmms/whatsapp';
import { evaluateTrigger } from './triggers';
import { checkFrequency, recordSend } from './frequency';
import { isKilled } from './kill-switch';
import { resolvePriority } from './priority';

export interface RunSummary {
  tenantId: string;
  evaluated: number;
  sent: number;
  skipped: number;
  failures: number;
  durationMs: number;
}

export interface RunnerOptions {
  tenantId: string;
  adapter?: WhatsAppAdapter;
  actorId?: string;
}

const MAX_PER_TICK = 200;

interface Candidate {
  automationId: string;
  customerId: string;
  priority: number;
  templateId: string | null;
  capHours: number;
}

export async function runAutomationsForTenant(
  opts: RunnerOptions,
): Promise<RunSummary> {
  const start = Date.now();
  const adapter = opts.adapter ?? new MockWhatsAppAdapter();
  const actorId = opts.actorId ?? 'system';

  const tenant = await prisma.tenant.findUnique({ where: { id: opts.tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  const automations = await prisma.automation.findMany({
    where: { tenantId: opts.tenantId, status: 'ACTIVE' },
    orderBy: { priority: 'asc' },
  });

  let evaluated = 0;
  let sent = 0;
  let skipped = 0;
  let failures = 0;

  const candidates: Candidate[] = [];

  for (const automation of automations) {
    if (await isKilled(opts.tenantId, automation.id)) {
      skipped += 1;
      continue;
    }

    const trigger = await evaluateTrigger({
      tenantId: opts.tenantId,
      automation: {
        id: automation.id,
        slug: automation.slug,
        definition: automation.definition,
      },
    });

    for (const customerId of trigger.customerIds) {
      evaluated += 1;
      candidates.push({
        automationId: automation.id,
        customerId,
        priority: automation.priority,
        templateId: automation.templateId,
        capHours: automation.frequencyCapHours,
      });
    }
  }

  const byCustomer = new Map<string, Candidate[]>();
  for (const c of candidates) {
    const list = byCustomer.get(c.customerId) ?? [];
    list.push(c);
    byCustomer.set(c.customerId, list);
  }

  let processed = 0;
  for (const [customerId, list] of byCustomer) {
    if (processed >= MAX_PER_TICK) break;
    processed += 1;

    const winner = resolvePriority(
      list.map((c) => ({
        automationId: c.automationId,
        customerId: c.customerId,
        priority: c.priority,
        runId: '',
      })),
    );
    if (!winner) {
      skipped += 1;
      continue;
    }

    const winnerCandidate = list.find((c) => c.automationId === winner.automationId);
    if (!winnerCandidate) {
      skipped += 1;
      continue;
    }

    const automation = automations.find((a) => a.id === winnerCandidate.automationId);
    if (!automation) {
      skipped += 1;
      continue;
    }

    const freq = await checkFrequency({
      tenantId: opts.tenantId,
      customerId,
      capHours: winnerCandidate.capHours,
    });
    if (!freq.allowed) {
      await prisma.automationRun.create({
        data: {
          tenantId: opts.tenantId,
          automationId: automation.id,
          customerId,
          status: 'SKIPPED',
          exitReason: 'frequency_cap',
        },
      });
      skipped += 1;
      continue;
    }

    const consent = await assertConsent({
      tenantId: opts.tenantId,
      customerId,
      channel: 'WHATSAPP',
      purpose: 'MARKETING',
    });
    if (!consent.allowed) {
      await prisma.automationRun.create({
        data: {
          tenantId: opts.tenantId,
          automationId: automation.id,
          customerId,
          status: 'SKIPPED',
          exitReason: `consent:${consent.reason ?? 'blocked'}`,
        },
      });
      skipped += 1;
      continue;
    }

    const run = await prisma.automationRun.create({
      data: {
        tenantId: opts.tenantId,
        automationId: automation.id,
        customerId,
        status: 'ENTERED',
      },
    });

    try {
      const customer = await prisma.endCustomer.findUnique({
        where: { id: customerId },
      });
      if (!customer) throw new Error('customer_missing');

      const template = automation.templateId
        ? await prisma.template.findUnique({ where: { id: automation.templateId } })
        : null;

      const body = template
        ? renderTemplate(template.bodyText, {
            first_name: customer.name?.split(' ')[0] ?? '',
            zone: customer.zone ?? '',
            business_name: tenant.nameEn,
          })
        : `Automated message: ${automation.name}`;

      const sendResult = await adapter.sendTemplate({
        to: customer.phone,
        templateName: template?.name ?? automation.slug,
        language: customer.language,
        variables: { first_name: customer.name?.split(' ')[0] ?? '' },
      });

      if (!sendResult.ok) throw new Error(sendResult.error ?? 'send_failed');

      const message = await prisma.message.create({
        data: {
          tenantId: opts.tenantId,
          customerId,
          channel: 'WHATSAPP',
          templateId: automation.templateId,
          body,
          status: 'SENT',
          metaMessageId: sendResult.metaMessageId,
          sentAt: new Date(),
          consentRef: consent.consentId,
          costCategory: 'MARKETING',
        },
      });

      await recordSend(opts.tenantId, customerId);

      await prisma.automationRun.update({
        where: { id: run.id },
        data: {
          status: 'MESSAGED',
          messageId: message.id,
          exitedAt: new Date(),
          exitReason: 'sent',
        },
      });

      await logAudit(
        opts.tenantId,
        actorId,
        'automation.send',
        `automation:${automation.id}`,
        consent.consentId,
      );
      sent += 1;
    } catch (e) {
      await prisma.automationRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          exitedAt: new Date(),
          exitReason: (e as Error).message,
        },
      });
      failures += 1;
    }
  }

  return {
    tenantId: opts.tenantId,
    evaluated,
    sent,
    skipped,
    failures,
    durationMs: Date.now() - start,
  };
}
