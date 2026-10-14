import { prisma } from '@lmms/db';

export interface CohortInput {
  tenantId: string;
  cohortDate: Date;
}

export interface CohortResult {
  cohortDate: Date;
  cohortLabel: string;
  totalCustomers: number;
  activeCount: number;
  lapsedCount: number;
  dormantCount: number;
  averageOrders: number;
  averageRevenue: number;
  retention30: number;
  retention60: number;
  retention90: number;
}

/**
 * Build a single cohort snapshot for a given cohort date (typically the
 * first of a month). Buckets customers by whether they placed an order
 * in the following 30/60/90 days.
 */
export async function buildCohortSnapshot(input: CohortInput): Promise<CohortResult> {
  const cohortStart = new Date(input.cohortDate);
  const cohortEnd = new Date(
    Date.UTC(cohortStart.getUTCFullYear(), cohortStart.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );

  const customers = await prisma.endCustomer.findMany({
    where: {
      tenantId: input.tenantId,
      createdAt: { gte: cohortStart, lte: cohortEnd },
    },
    select: { id: true },
  });

  const customerIds = customers.map((c) => c.id);
  if (customerIds.length === 0) {
    return {
      cohortDate: cohortStart,
      cohortLabel: cohortStart.toISOString().slice(0, 7),
      totalCustomers: 0,
      activeCount: 0,
      lapsedCount: 0,
      dormantCount: 0,
      averageOrders: 0,
      averageRevenue: 0,
      retention30: 0,
      retention60: 0,
      retention90: 0,
    };
  }

  const orders = await prisma.order.findMany({
    where: {
      tenantId: input.tenantId,
      customerId: { in: customerIds },
    },
    select: { customerId: true, orderDate: true, amount: true },
  });

  const window30 = new Date(cohortEnd.getTime() + 30 * 86_400_000);
  const window60 = new Date(cohortEnd.getTime() + 60 * 86_400_000);
  const window90 = new Date(cohortEnd.getTime() + 90 * 86_400_000);

  const inWindow = new Set<string>();
  const in30 = new Set<string>();
  const in60 = new Set<string>();
  const in90 = new Set<string>();
  const revenueByCustomer = new Map<string, number>();
  const orderCountByCustomer = new Map<string, number>();

  for (const o of orders) {
    inWindow.add(o.customerId);
    revenueByCustomer.set(
      o.customerId,
      (revenueByCustomer.get(o.customerId) ?? 0) + Number(o.amount),
    );
    orderCountByCustomer.set(
      o.customerId,
      (orderCountByCustomer.get(o.customerId) ?? 0) + 1,
    );
    const t = o.orderDate.getTime();
    if (t <= window30.getTime()) in30.add(o.customerId);
    if (t <= window60.getTime()) in60.add(o.customerId);
    if (t <= window90.getTime()) in90.add(o.customerId);
  }

  const total = customerIds.length;
  const active = in30.size;
  const lapsed = in60.size - in30.size;
  const dormant = total - in60.size;

  const totalOrders = [...orderCountByCustomer.values()].reduce((s, v) => s + v, 0);
  const totalRevenue = [...revenueByCustomer.values()].reduce((s, v) => s + v, 0);

  return {
    cohortDate: cohortStart,
    cohortLabel: cohortStart.toISOString().slice(0, 7),
    totalCustomers: total,
    activeCount: active,
    lapsedCount: Math.max(0, lapsed),
    dormantCount: Math.max(0, dormant),
    averageOrders: total > 0 ? Math.round((totalOrders / total) * 100) / 100 : 0,
    averageRevenue: total > 0 ? Math.round((totalRevenue / total) * 100) / 100 : 0,
    retention30: Math.round((in30.size / total) * 10000) / 100,
    retention60: Math.round((in60.size / total) * 10000) / 100,
    retention90: Math.round((in90.size / total) * 10000) / 100,
  };
}
