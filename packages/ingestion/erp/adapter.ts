import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';

export interface ErpCustomer {
  externalId: string;
  phone: string;
  email?: string | null;
  name?: string | null;
  language?: string | null;
  zone?: string | null;
}

export interface ErpOrder {
  externalId: string;
  customerExternalId: string;
  orderDate: string;
  serviceType?: string | null;
  amount: number;
  currency: string;
  status: string;
}

export interface ErpAdapter {
  validate(): Promise<boolean>;
  fetchCustomers(since?: Date): Promise<ErpCustomer[]>;
  fetchOrders(since?: Date): Promise<ErpOrder[]>;
}

export class MockErpAdapter implements ErpAdapter {
  async validate(): Promise<boolean> { return true; }
  async fetchCustomers(): Promise<ErpCustomer[]> {
    return [
      { externalId: 'ERP-001', phone: '+971501234567', email: 'a@example.com', name: 'Mock A' },
      { externalId: 'ERP-002', phone: '+971509999999', email: 'b@example.com', name: 'Mock B' },
    ];
  }
  async fetchOrders(): Promise<ErpOrder[]> {
    return [
      { externalId: 'ORD-001', customerExternalId: 'ERP-001', orderDate: new Date().toISOString(), amount: 120, currency: 'AED', status: 'DELIVERED', serviceType: 'WASH' },
    ];
  }
}

export class RestErpAdapter implements ErpAdapter {
  constructor(private readonly apiUrl: string, private readonly apiKey: string) {}

  async validate(): Promise<boolean> {
    if (!this.apiUrl || !this.apiKey) return false;
    try {
      const res = await fetch(`${this.apiUrl}/health`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async fetchCustomers(since?: Date): Promise<ErpCustomer[]> {
    const url = new URL(`${this.apiUrl}/customers`);
    if (since) url.searchParams.append('updated_since', since.toISOString());

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${this.apiKey}`, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`erp_api_error:customers:${res.status}`);
    return (await res.json()) as ErpCustomer[];
  }

  async fetchOrders(since?: Date): Promise<ErpOrder[]> {
    const url = new URL(`${this.apiUrl}/orders`);
    if (since) url.searchParams.append('updated_since', since.toISOString());

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${this.apiKey}`, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`erp_api_error:orders:${res.status}`);
    return (await res.json()) as ErpOrder[];
  }
}

/**
 * Factory: gets the right adapter based on tenant config.
 */
export async function createErpAdapterForTenant(tenantId: string): Promise<ErpAdapter> {
  const config = await prisma.erpConfig.findUnique({ where: { tenantId } });
  if (!config || config.status !== 'CONNECTED') {
    return new MockErpAdapter();
  }
  return new RestErpAdapter(config.apiUrl, config.apiKey);
}

export interface SyncResult {
  customersUpserted: number;
  ordersUpserted: number;
  status: 'CONNECTED' | 'STALE' | 'FAILED';
  error?: string;
}

export async function runErpSync(
  tenantId: string,
  adapter: ErpAdapter,
  actorId: string,
): Promise<SyncResult> {
  const ds = await prisma.dataSource.findFirst({ where: { tenantId, type: 'ERP' } });
  if (ds) {
    await prisma.dataSource.update({ where: { id: ds.id }, data: { status: 'SYNCING' } });
  }

  try {
    const ok = await adapter.validate();
    if (!ok) throw new Error('erp_validation_failed');

    const erpConfig = await prisma.erpConfig.findUnique({ where: { tenantId } });
    const since = erpConfig?.lastSyncAt || undefined;

    const customers = await adapter.fetchCustomers(since);
    let customersUpserted = 0;

    for (const c of customers) {
      const existing = await prisma.endCustomer.findFirst({ where: { tenantId, phone: c.phone } });
      if (existing) {
        await prisma.endCustomer.update({
          where: { id: existing.id },
          data: { externalId: c.externalId, email: c.email ?? existing.email },
        });
      } else {
        await prisma.endCustomer.create({
          data: {
            tenantId,
            phone: c.phone,
            email: c.email ?? null,
            name: c.name ?? null,
            language: c.language ?? 'ar',
            zone: c.zone ?? null,
            source: 'ERP',
            externalId: c.externalId,
            consentVerified: true,
          },
        });
      }
      customersUpserted += 1;
    }

    const orders = await adapter.fetchOrders(since);
    let ordersUpserted = 0;
    for (const o of orders) {
      const customer = await prisma.endCustomer.findFirst({
        where: { tenantId, externalId: o.customerExternalId },
      });
      if (!customer) continue;
      
      await prisma.order.upsert({
        where: { tenantId_externalId: { tenantId, externalId: o.externalId } },
        update: { amount: o.amount, status: o.status },
        create: {
          tenantId,
          customerId: customer.id,
          externalId: o.externalId,
          orderDate: new Date(o.orderDate),
          serviceType: o.serviceType ?? null,
          amount: o.amount,
          currency: o.currency,
          status: o.status,
        },
      });
      ordersUpserted += 1;
    }

    if (ds) {
      await prisma.dataSource.update({ where: { id: ds.id }, data: { status: 'CONNECTED', lastSyncAt: new Date() } });
    } else {
      await prisma.dataSource.create({ data: { tenantId, type: 'ERP', status: 'CONNECTED', lastSyncAt: new Date() } });
    }

    if (erpConfig) {
      await prisma.erpConfig.update({ where: { tenantId }, data: { lastSyncAt: new Date() } });
    }

    await logAudit(tenantId, actorId, 'erp.sync.success', `tenant:${tenantId}`);
    return { customersUpserted, ordersUpserted, status: 'CONNECTED' };
  } catch (e) {
    const message = (e as Error).message;
    if (ds) {
      await prisma.dataSource.update({ where: { id: ds.id }, data: { status: 'FAILED' } });
    }
    await logAudit(tenantId, actorId, 'erp.sync.failed', `tenant:${tenantId}`);
    return { customersUpserted: 0, ordersUpserted: 0, status: 'FAILED', error: message };
  }
}
