import { prisma } from '@lmms/db';
import { assertGraphValid } from './validate';
import { evaluateJourneyTrigger } from './triggers';
import type { JourneyDefinition } from './schema';

export interface SimulateResult {
  wouldEnter: number;
  wouldSendTo: number;
  sampleCustomers: Array<{ id: string; name: string | null; phone: string }>;
}

export async function simulateJourney(opts: {
  tenantId: string;
  definition: unknown;
  sampleSize?: number;
}): Promise<SimulateResult> {
  const graph = assertGraphValid(opts.definition);
  const trigger = graph.nodes.find((n) => n.type === 'TRIGGER');
  if (!trigger || !trigger.trigger) {
    return { wouldEnter: 0, wouldSendTo: 0, sampleCustomers: [] };
  }

  const { customerIds } = await evaluateJourneyTrigger({
    tenantId: opts.tenantId,
    triggerType: trigger.trigger.type,
    value: trigger.trigger.value,
  });

  const sample = await prisma.endCustomer.findMany({
    where: {
      tenantId: opts.tenantId,
      id: { in: customerIds.slice(0, opts.sampleSize ?? 5) },
    },
    select: { id: true, name: true, phone: true },
  });

  const hasSend = graph.nodes.some((n) => n.type === 'SEND');

  return {
    wouldEnter: customerIds.length,
    wouldSendTo: hasSend ? customerIds.length : 0,
    sampleCustomers: sample,
  };
}
