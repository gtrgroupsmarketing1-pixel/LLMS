import { prisma } from '@lmms/db';

export interface TenantSnapshot {
  capturedAt: string;
  tenant: { mode: string; greenTickStatus: string | null };
  dataSources: Array<{
    id: string;
    type: string;
    status: string;
    lastSyncAt: string | null;
  }>;
  customers: Array<{
    id: string;
    externalId: string | null;
    source: string;
  }>;
}

export async function snapshotTenant(tenantId: string): Promise<TenantSnapshot> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant_not_found');
  const sources = await prisma.dataSource.findMany({ where: { tenantId } });
  const customers = await prisma.endCustomer.findMany({
    where: { tenantId },
    select: { id: true, externalId: true, source: true },
  });
  return {
    capturedAt: new Date().toISOString(),
    tenant: {
      mode: tenant.mode,
      greenTickStatus: tenant.greenTickStatus ?? null,
    },
    dataSources: sources.map((s) => ({
      id: s.id,
      type: s.type,
      status: s.status,
      lastSyncAt: s.lastSyncAt?.toISOString() ?? null,
    })),
    customers: customers.map((c) => ({
      id: c.id,
      externalId: c.externalId,
      source: c.source,
    })),
  };
}

export async function restoreFromSnapshot(
  tenantId: string,
  snapshot: TenantSnapshot,
): Promise<void> {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { mode: snapshot.tenant.mode },
  });

  for (const ds of snapshot.dataSources) {
    await prisma.dataSource.update({
      where: { id: ds.id },
      data: {
        status: ds.status as never,
        lastSyncAt: ds.lastSyncAt ? new Date(ds.lastSyncAt) : null,
      },
    });
  }

  for (const c of snapshot.customers) {
    await prisma.endCustomer.update({
      where: { id: c.id },
      data: { externalId: c.externalId, source: c.source },
    });
  }
}
