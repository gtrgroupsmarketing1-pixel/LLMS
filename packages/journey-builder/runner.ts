import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import { assertConsent } from '@lmms/compliance';
import { MockWhatsAppAdapter, type WhatsAppAdapter } from '@lmms/whatsapp';
import { assertGraphValid } from './validate';
import type { JourneyDefinition } from './schema';
import { evaluateJourneyTrigger } from './triggers';
import { checkExitRules } from './exit-rules';

export interface RunnerOptions {
  tenantId: string;
  adapter?: WhatsAppAdapter;
  actorId?: string;
}

export interface RunnerSummary {
  journeysEvaluated: number;
  customersEntered: number;
  messagesSent: number;
  exits: number;
  failures: number;
  durationMs: number;
}

const MAX_PER_TICK = 200;

export async function runJourneysForTenant(
  opts: RunnerOptions,
): Promise<RunnerSummary> {
  const start = Date.now();
  const adapter = opts.adapter ?? new MockWhatsAppAdapter();
  const actorId = opts.actorId ?? 'system';

  const tenant = await prisma.tenant.findUnique({ where: { id: opts.tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  const journeys = await prisma.journey.findMany({
    where: { tenantId: opts.tenantId, status: 'ACTIVE' },
    orderBy: { priority: 'asc' },
  });

  let journeysEvaluated = 0;
  let customersEntered = 0;
  let messagesSent = 0;
  let exits = 0;
  let failures = 0;
  let processed = 0;

  for (const journey of journeys) {
    journeysEvaluated += 1;

    const killed = await prisma.journeyKillSwitch.findUnique({
      where: { tenantId_journeyId: { tenantId: opts.tenantId, journeyId: journey.id } },
    });
    if (killed) continue;

    let graph: JourneyDefinition;
    try {
      graph = assertGraphValid(journey.definition);
    } catch {
      failures += 1;
      continue;
    }

    const trigger = graph.nodes.find((n) => n.type === 'TRIGGER');
    if (!trigger || !trigger.trigger) continue;

    const { customerIds } = await evaluateJourneyTrigger({
      tenantId: opts.tenantId,
      triggerType: trigger.trigger.type,
      value: trigger.trigger.value,
    });

    for (const customerId of customerIds) {
      if (processed >= MAX_PER_TICK) break;
      processed += 1;

      const alreadyRunning = await prisma.journeyRun.findFirst({
        where: {
          tenantId: opts.tenantId,
          journeyId: journey.id,
          customerId,
          status: { in: ['ENTERED', 'RUNNING'] },
        },
      });
      if (alreadyRunning) continue;

      const exit = await checkExitRules({
        tenantId: opts.tenantId,
        customerId,
        rules: graph.exitRules ?? [],
      });
      if (exit.shouldExit) {
        exits += 1;
        continue;
      }

      const run = await prisma.journeyRun.create({
        data: {
          tenantId: opts.tenantId,
          journeyId: journey.id,
          customerId,
          status: 'ENTERED',
        },
      });
      customersEntered += 1;

      const sendNode = graph.nodes.find((n) => n.type === 'SEND');
      if (!sendNode || !sendNode.send) {
        await prisma.journeyRun.update({
          where: { id: run.id },
          data: {
            status: 'COMPLETED',
            exitedAt: new Date(),
            exitReason: 'no_send_node',
          },
        });
        continue;
      }

      const consent = await assertConsent({
        tenantId: opts.tenantId,
        customerId,
        channel: 'WHATSAPP',
        purpose: 'MARKETING',
      });
      if (!consent.allowed) {
        await prisma.journeyRun.update({
          where: { id: run.id },
          data: {
            status: 'EXITED',
            exitedAt: new Date(),
            exitReason: `consent:${consent.reason ?? 'blocked'}`,
          },
        });
        exits += 1;
        continue;
      }

      const capLedger = await prisma.frequencyLedger.findUnique({
        where: {
          tenantId_customerId: {
            tenantId: opts.tenantId,
            customerId,
          },
        },
      });
      if (capLedger) {
        const elapsed = Date.now() - capLedger.lastSendAt.getTime();
        if (elapsed < journey.frequencyCapHours * 3_600_000) {
          await prisma.journeyRun.update({
            where: { id: run.id },
            data: {
              status: 'EXITED',
              exitedAt: new Date(),
              exitReason: 'frequency_cap',
            },
          });
          exits += 1;
          continue;
        }
      }

      try {
        const customer = await prisma.endCustomer.findUnique({
          where: { id: customerId },
        });
        if (!customer) throw new Error('customer_missing');

        const sendResult = await adapter.sendTemplate({
          to: customer.phone,
          templateName: 'journey_send',
          language: customer.language,
          variables: { first_name: customer.name?.split(' ')[0] ?? '' },
        });

        if (!sendResult.ok) throw new Error(sendResult.error ?? 'send_failed');

        const now = new Date();
        await prisma.message.create({
          data: {
            tenantId: opts.tenantId,
            customerId,
            channel: 'WHATSAPP',
            body: `Journey message: ${journey.name}`,
            status: 'SENT',
            metaMessageId: sendResult.metaMessageId,
            sentAt: now,
            consentRef: consent.consentId,
            costCategory: 'MARKETING',
          },
        });

        await prisma.frequencyLedger.upsert({
          where: {
            tenantId_customerId: { tenantId: opts.tenantId, customerId },
          },
          update: { lastSendAt: now, count24h: { increment: 1 } },
          create: {
            tenantId: opts.tenantId,
            customerId,
            lastSendAt: now,
            count24h: 1,
          },
        });

        await prisma.journeyRun.update({
          where: { id: run.id },
          data: {
            status: 'MESSAGED',
            exitedAt: new Date(),
            exitReason: 'sent',
          },
        });
        messagesSent += 1;
      } catch (e) {
        await prisma.journeyRun.update({
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

    if (processed >= MAX_PER_TICK) break;
  }

  if (messagesSent > 0) {
    await logAudit(
      opts.tenantId,
      actorId,
      'journey.runner.tick',
      `tenant:${opts.tenantId}`,
    );
  }

  return {
    journeysEvaluated,
    customersEntered,
    messagesSent,
    exits,
    failures,
    durationMs: Date.now() - start,
  };
}
