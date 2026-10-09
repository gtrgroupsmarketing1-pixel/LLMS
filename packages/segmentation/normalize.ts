import { prisma } from '@lmms/db';
import type { NormalizedCustomer } from './dsl';

const VIP_THRESHOLD_ORDERS = 10;
const VIP_THRESHOLD_SPEND = 1000;
const ENGAGEMENT_WINDOW_DAYS = 30;

export async function loadNormalizedCustomers(
  tenantId: string,
): Promise<NormalizedCustomer[]> {
  const customers = await prisma.endCustomer.findMany({ where: { tenantId } });
  const orders = await prisma.order.findMany({ where: { tenantId } });

  const ordersByCustomer = new Map<string, typeof orders>();
  for (const o of orders) {
    const list = ordersByCustomer.get(o.customerId) ?? [];
    list.push(o);
    ordersByCustomer.set(o.customerId, list);
  }

  const now = Date.now();
  return customers.map((c) => {
    const custOrders = ordersByCustomer.get(c.id) ?? [];
    const orderCount = custOrders.length;
    const totalSpend = custOrders.reduce((sum, o) => sum + Number(o.amount), 0);
    const avgOrderValue = orderCount > 0 ? totalSpend / orderCount : 0;
    const lastOrder =
      custOrders
        .map((o) => new Date(o.orderDate).getTime())
        .sort((a, b) => b - a)[0] ?? null;
    const daysSinceLastOrder = lastOrder
      ? Math.floor((now - lastOrder) / 86_400_000)
      : null;
    const recentOrders = custOrders.filter(
      (o) =>
        now - new Date(o.orderDate).getTime() <
        ENGAGEMENT_WINDOW_DAYS * 86_400_000,
    );

    return {
      id: c.id,
      tenantId: c.tenantId,
      language: c.language,
      zone: c.zone,
      source: c.source,
      createdAt: c.createdAt,
      orderCount,
      lastOrderAt: lastOrder ? new Date(lastOrder) : null,
      totalSpend,
      avgOrderValue,
      daysSinceLastOrder,
      isVip: orderCount >= VIP_THRESHOLD_ORDERS || totalSpend >= VIP_THRESHOLD_SPEND,
      isSubscription: custOrders.some((o) => o.serviceType === 'SUBSCRIPTION'),
      isCommercial: custOrders.some((o) => o.serviceType === 'COMMERCIAL'),
      engagementScore: recentOrders.length,
      promoRedeemed: false,
      whatsappOptIn: c.source === 'WHATSAPP_OPTIN',
      websiteLead: c.source === 'WEBSITE_FORM',
    };
  });
}
