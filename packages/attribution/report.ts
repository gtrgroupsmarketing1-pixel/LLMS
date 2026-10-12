import { prisma } from '@lmms/db';

export interface AttributionReport {
  period: { start: string; end: string };
  totalAttributedRevenue: number;
  totalAttributedOrders: number;
  unattributedRevenue: number;
  unattributedOrders: number;
  byConfidence: {
    HIGH: { revenue: number; orders: number };
    MEDIUM: { revenue: number; orders: number };
    ESTIMATED: { revenue: number; orders: number };
  };
  bySource: Array<{
    source: string;
    revenue: number;
    orders: number;
    confidence: string;
  }>;
}

export async function buildReport(
  tenantId: string,
  since: Date,
  until: Date,
): Promise<AttributionReport> {
  const attributions = await prisma.attribution.findMany({
    where: {
      tenantId,
      attributedAt: { gte: since, lte: until },
    },
  });

  const totalRevenue = attributions.reduce((s, a) => s + Number(a.revenue), 0);
  const totalOrders = attributions.length;

  const byConfidence = {
    HIGH: { revenue: 0, orders: 0 },
    MEDIUM: { revenue: 0, orders: 0 },
    ESTIMATED: { revenue: 0, orders: 0 },
  };
  const bySourceMap = new Map<
    string,
    { revenue: number; orders: number; confidence: string }
  >();

  for (const a of attributions) {
    const rev = Number(a.revenue);
    const conf = a.confidence as 'HIGH' | 'MEDIUM' | 'ESTIMATED';
    byConfidence[conf].revenue += rev;
    byConfidence[conf].orders += 1;

    const key = a.source;
    const existing = bySourceMap.get(key) ?? {
      revenue: 0,
      orders: 0,
      confidence: conf,
    };
    existing.revenue += rev;
    existing.orders += 1;
    bySourceMap.set(key, existing);
  }

  // Unattributed revenue = orders in window without an attribution row.
  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      orderDate: { gte: since, lte: until },
    },
  });
  const attributedOrderIds = new Set(
    attributions.map((a) => a.orderId).filter((x): x is string => !!x),
  );
  let unattributedRevenue = 0;
  let unattributedOrders = 0;
  for (const o of orders) {
    if (!attributedOrderIds.has(o.id)) {
      unattributedRevenue += Number(o.amount);
      unattributedOrders += 1;
    }
  }

  return {
    period: { start: since.toISOString(), end: until.toISOString() },
    totalAttributedRevenue: Math.round(totalRevenue * 100) / 100,
    totalAttributedOrders: totalOrders,
    unattributedRevenue: Math.round(unattributedRevenue * 100) / 100,
    unattributedOrders,
    byConfidence,
    bySource: [...bySourceMap.entries()].map(([source, v]) => ({
      source,
      revenue: Math.round(v.revenue * 100) / 100,
      orders: v.orders,
      confidence: v.confidence,
    })),
  };
}
