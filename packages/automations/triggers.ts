import { prisma } from '@lmms/db';

export interface TriggerInput {
  tenantId: string;
  automation: { id: string; slug: string; definition: unknown };
}

export interface TriggerResult {
  customerIds: string[];
}

export async function evaluateTrigger(input: TriggerInput): Promise<TriggerResult> {
  const def = input.automation.definition as
    | { type: 'ORDER_DELIVERED' }
    | { type: 'DAYS_SINCE_LAST_ORDER'; value: number }
    | { type: 'DAYS_SINCE_LAST_ENGAGEMENT'; value: number }
    | { type: 'NEW_CUSTOMER' }
    | { type: 'PROMO_NOT_REDEEMED' };

  switch (def.type) {
    case 'ORDER_DELIVERED': {
      const since = new Date(Date.now() - 24 * 3600 * 1000);
      const orders = await prisma.order.findMany({
        where: {
          tenantId: input.tenantId,
          status: 'DELIVERED',
          orderDate: { gte: since },
        },
        select: { customerId: true },
      });
      return { customerIds: [...new Set(orders.map((o) => o.customerId))] };
    }

    case 'DAYS_SINCE_LAST_ORDER': {
      const days = def.value;
      const lower = new Date(Date.now() - (days + 1) * 86_400_000);
      const upper = new Date(Date.now() - days * 86_400_000);
      const customers = await prisma.endCustomer.findMany({
        where: { tenantId: input.tenantId },
        select: { id: true },
      });
      const matches: string[] = [];
      for (const c of customers) {
        const last = await prisma.order.findFirst({
          where: { tenantId: input.tenantId, customerId: c.id },
          orderBy: { orderDate: 'desc' },
          select: { orderDate: true },
        });
        if (!last) continue;
        const t = last.orderDate.getTime();
        if (t >= lower.getTime() && t <= upper.getTime()) matches.push(c.id);
      }
      return { customerIds: matches };
    }

    case 'DAYS_SINCE_LAST_ENGAGEMENT': {
      const days = def.value;
      const lower = new Date(Date.now() - (days + 1) * 86_400_000);
      const upper = new Date(Date.now() - days * 86_400_000);
      const customers = await prisma.endCustomer.findMany({
        where: { tenantId: input.tenantId },
        select: { id: true },
      });
      const matches: string[] = [];
      for (const c of customers) {
        const last = await prisma.message.findFirst({
          where: {
            tenantId: input.tenantId,
            customerId: c.id,
            status: { in: ['SENT', 'DELIVERED', 'READ', 'REPLIED'] },
          },
          orderBy: { sentAt: 'desc' },
          select: { sentAt: true },
        });
        if (!last || !last.sentAt) continue;
        const t = last.sentAt.getTime();
        if (t >= lower.getTime() && t <= upper.getTime()) matches.push(c.id);
      }
      return { customerIds: matches };
    }

    case 'NEW_CUSTOMER': {
      const since = new Date(Date.now() - 24 * 3600 * 1000);
      const customers = await prisma.endCustomer.findMany({
        where: { tenantId: input.tenantId, createdAt: { gte: since } },
        select: { id: true },
      });
      return { customerIds: customers.map((c) => c.id) };
    }

    case 'PROMO_NOT_REDEEMED': {
      const since = new Date(Date.now() - 7 * 86_400_000);
      const campaigns = await prisma.campaign.findMany({
        where: {
          tenantId: input.tenantId,
          promoCodeId: { not: null },
          createdAt: { gte: since },
        },
        select: { id: true },
      });
      const campaignIds = campaigns.map((c) => c.id);
      const messages = await prisma.message.findMany({
        where: {
          tenantId: input.tenantId,
          campaignId: { in: campaignIds },
          status: { in: ['SENT', 'DELIVERED', 'READ'] },
        },
        select: { customerId: true },
      });
      return { customerIds: [...new Set(messages.map((m) => m.customerId))] };
    }
  }
  return { customerIds: [] };
}
