import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import type { ErpAdapter } from '@lmms/ingestion';
import { matchCustomerToErp, buildErpIndex } from './matcher';
import { snapshotTenant, restoreFromSnapshot, type TenantSnapshot } from './rollback';
import {
  assertTransition,
  assertUpgradeSource,
  assertRollbackAllowed,
  type MigrationStatus,
} from './states';

export interface StartMigrationInput {
  tenantId: string;
  actorId: string;
  adapter: ErpAdapter;
}

export interface StartMigrationResult {
  jobId: string;
  status: MigrationStatus;
  matched: number;
  unmatched: number;
  ambiguous: number;
}

export async function startMigration(
  input: StartMigrationInput,
): Promise<StartMigrationResult> {
  const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId } });
  if (!tenant) throw new Error('tenant_not_found');
  assertUpgradeSource(tenant.mode);

  const snapshot = await snapshotTenant(input.tenantId);

  const job = await prisma.migrationJob.create({
    data: {
      tenantId: input.tenantId,
      fromMode: 'STANDALONE',
      toMode: 'ERP_CONNECTED',
      status: 'INITIATED',
      actorId: input.actorId,
      preSnapshot: snapshot as never,
    },
  });

  await prisma.migrationEvent.create({
    data: { jobId: job.id, tenantId: input.tenantId, step: 'INITIATED' },
  });

  await prisma.tenant.update({
    where: { id: input.tenantId },
    data: { mode: 'UPGRADING' },
  });

  await logAudit(input.tenantId, input.actorId, 'migration.init', `job:${job.id}`);

  await prisma.migrationJob.update({
    where: { id: job.id },
    data: { status: 'MATCHING' },
  });

  const erpCustomers = await input.adapter.fetchCustomers();
  const erpIndex = buildErpIndex(erpCustomers);

  const lmmsCustomers = await prisma.endCustomer.findMany({
    where: { tenantId: input.tenantId },
    select: { id: true, phone: true, email: true },
  });

  let matched = 0;
  let unmatched = 0;
  let ambiguous = 0;

  for (const c of lmmsCustomers) {
    const result = matchCustomerToErp({ phone: c.phone, email: c.email }, erpIndex);
    if (result.status === 'MATCHED_PHONE' || result.status === 'MATCHED_EMAIL') {
      await prisma.migrationMatch.create({
        data: {
          jobId: job.id,
          tenantId: input.tenantId,
          lmmsCustomerId: c.id,
          erpExternalId: result.erpExternalId,
          status: result.status,
          confidence: result.confidence,
        },
      });
      matched += 1;
    } else if (result.status === 'AMBIGUOUS') {
      await prisma.migrationMatch.create({
        data: {
          jobId: job.id,
          tenantId: input.tenantId,
          lmmsCustomerId: c.id,
          status: 'AMBIGUOUS',
          confidence: 40,
          notes: `candidates:${result.candidates.join(',')}`,
        },
      });
      ambiguous += 1;
    } else {
      await prisma.migrationMatch.create({
        data: {
          jobId: job.id,
          tenantId: input.tenantId,
          lmmsCustomerId: c.id,
          status: 'UNMATCHED',
          confidence: 0,
        },
      });
      unmatched += 1;
    }
  }

  const next: MigrationStatus =
    unmatched + ambiguous > 0 ? 'AWAITING_REVIEW' : 'BACKFILLING';

  await prisma.migrationJob.update({
    where: { id: job.id },
    data: {
      status: next,
      matchSummary: { matched, unmatched, ambiguous } as never,
    },
  });

  await prisma.migrationEvent.create({
    data: {
      jobId: job.id,
      tenantId: input.tenantId,
      step: 'MATCHED',
      meta: { matched, unmatched, ambiguous } as never,
    },
  });

  return { jobId: job.id, status: next, matched, unmatched, ambiguous };
}

export interface ResolveMatchInput {
  tenantId: string;
  actorId: string;
  jobId: string;
  matchId: string;
  erpExternalId: string | null;
  decision: 'ASSIGN' | 'SKIP';
}

export async function resolveMatch(input: ResolveMatchInput) {
  const match = await prisma.migrationMatch.findUnique({
    where: { id: input.matchId },
  });
  if (!match || match.tenantId !== input.tenantId || match.jobId !== input.jobId) {
    throw new Error('match_not_found');
  }
  if (match.status !== 'UNMATCHED' && match.status !== 'AMBIGUOUS') {
    throw new Error('match_already_resolved');
  }

  if (input.decision === 'ASSIGN') {
    if (!input.erpExternalId) throw new Error('erp_external_id_required');
    await prisma.migrationMatch.update({
      where: { id: input.matchId },
      data: {
        erpExternalId: input.erpExternalId,
        status: 'MATCHED_MANUAL',
        confidence: 60,
        resolvedBy: input.actorId,
        resolvedAt: new Date(),
      },
    });
  } else {
    await prisma.migrationMatch.update({
      where: { id: input.matchId },
      data: {
        resolvedBy: input.actorId,
        resolvedAt: new Date(),
        notes: match.notes ? `${match.notes}|skipped` : 'skipped',
      },
    });
  }

  await logAudit(
    input.tenantId,
    input.actorId,
    'migration.match.resolve',
    `match:${input.matchId}`,
  );

  const remaining = await prisma.migrationMatch.count({
    where: { jobId: input.jobId, status: { in: ['UNMATCHED', 'AMBIGUOUS'] } },
  });
  if (remaining === 0) {
    await prisma.migrationJob.update({
      where: { id: input.jobId },
      data: { status: 'BACKFILLING' },
    });
  }
  return { remaining };
}

export interface BackfillInput {
  tenantId: string;
  actorId: string;
  jobId: string;
  adapter: ErpAdapter;
}

export interface BackfillResult {
  ordersBackfilled: number;
  customersLinked: number;
  status: MigrationStatus;
}

export async function backfillOrders(input: BackfillInput): Promise<BackfillResult> {
  const job = await prisma.migrationJob.findUnique({ where: { id: input.jobId } });
  if (!job || job.tenantId !== input.tenantId) throw new Error('job_not_found');
  if (job.status !== 'BACKFILLING') throw new Error(`invalid_status:${job.status}`);

  const matches = await prisma.migrationMatch.findMany({
    where: {
      jobId: input.jobId,
      status: { in: ['MATCHED_PHONE', 'MATCHED_EMAIL', 'MATCHED_MANUAL'] },
      erpExternalId: { not: null },
    },
  });
  const byErpId = new Map(
    matches.map((m) => [m.erpExternalId as string, m.lmmsCustomerId]),
  );

  const orders = await input.adapter.fetchOrders();
  let ordersBackfilled = 0;
  let customersLinked = 0;

  for (const o of orders) {
    const lmmsCustomerId = byErpId.get(o.customerExternalId);
    if (!lmmsCustomerId) continue;

    await prisma.order.upsert({
      where: {
        tenantId_externalId: { tenantId: input.tenantId, externalId: o.externalId },
      },
      update: { amount: o.amount, status: o.status },
      create: {
        tenantId: input.tenantId,
        customerId: lmmsCustomerId,
        externalId: o.externalId,
        orderDate: new Date(o.orderDate),
        serviceType: o.serviceType ?? null,
        amount: o.amount,
        currency: o.currency,
        status: o.status,
      },
    });
    ordersBackfilled += 1;
  }

  for (const m of matches) {
    await prisma.endCustomer.update({
      where: { id: m.lmmsCustomerId },
      data: { externalId: m.erpExternalId, source: 'ERP' },
    });
    customersLinked += 1;
  }

  await prisma.migrationJob.update({
    where: { id: input.jobId },
    data: {
      backfillStats: { ordersBackfilled, customersLinked } as never,
    },
  });

  await prisma.migrationEvent.create({
    data: {
      jobId: input.jobId,
      tenantId: input.tenantId,
      step: 'BACKFILLED',
      meta: { ordersBackfilled, customersLinked } as never,
    },
  });

  await logAudit(input.tenantId, input.actorId, 'migration.backfill', `job:${input.jobId}`);

  return { ordersBackfilled, customersLinked, status: 'BACKFILLING' };
}

export interface CompleteInput {
  tenantId: string;
  actorId: string;
  jobId: string;
}

export async function completeMigration(input: CompleteInput) {
  const job = await prisma.migrationJob.findUnique({ where: { id: input.jobId } });
  if (!job || job.tenantId !== input.tenantId) throw new Error('job_not_found');
  assertTransition(job.status as MigrationStatus, 'COMPLETED');

  await prisma.tenant.update({
    where: { id: input.tenantId },
    data: { mode: 'ERP_CONNECTED' },
  });

  const existing = await prisma.dataSource.findFirst({
    where: { tenantId: input.tenantId, type: 'ERP' },
  });
  if (!existing) {
    await prisma.dataSource.create({
      data: { tenantId: input.tenantId, type: 'ERP', status: 'CONNECTED' },
    });
  } else {
    await prisma.dataSource.update({
      where: { id: existing.id },
      data: { status: 'CONNECTED', lastSyncAt: new Date() },
    });
  }

  const updated = await prisma.migrationJob.update({
    where: { id: input.jobId },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });

  await prisma.migrationEvent.create({
    data: { jobId: input.jobId, tenantId: input.tenantId, step: 'COMPLETED' },
  });

  await logAudit(input.tenantId, input.actorId, 'migration.complete', `job:${input.jobId}`);
  return updated;
}

export interface RollbackInput {
  tenantId: string;
  actorId: string;
  jobId: string;
  reason?: string;
}

export async function rollbackMigration(input: RollbackInput) {
  const job = await prisma.migrationJob.findUnique({ where: { id: input.jobId } });
  if (!job || job.tenantId !== input.tenantId) throw new Error('job_not_found');
  assertRollbackAllowed(job.status as MigrationStatus);

  const snapshot = job.preSnapshot as unknown as TenantSnapshot | null;
  if (!snapshot) throw new Error('missing_snapshot');

  await restoreFromSnapshot(input.tenantId, snapshot);

  await prisma.migrationJob.update({
    where: { id: input.jobId },
    data: { status: 'ROLLED_BACK', rolledBackAt: new Date() },
  });

  await prisma.migrationEvent.create({
    data: {
      jobId: input.jobId,
      tenantId: input.tenantId,
      step: 'ROLLED_BACK',
      message: input.reason ?? null,
    },
  });

  await logAudit(input.tenantId, input.actorId, 'migration.rollback', `job:${input.jobId}`);
  return { rolledBack: true };
}

export async function listJobs(tenantId: string) {
  return prisma.migrationJob.findMany({
    where: { tenantId },
    orderBy: { startedAt: 'desc' },
  });
}

export async function getJob(tenantId: string, jobId: string) {
  const job = await prisma.migrationJob.findUnique({ where: { id: jobId } });
  if (!job || job.tenantId !== tenantId) return null;
  const [matches, events] = await Promise.all([
    prisma.migrationMatch.findMany({
      where: { jobId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.migrationEvent.findMany({
      where: { jobId },
      orderBy: { createdAt: 'asc' },
    }),
  ]);
  return { job, matches, events };
}

export async function listUnmatched(tenantId: string, jobId: string) {
  return prisma.migrationMatch.findMany({
    where: { tenantId, jobId, status: { in: ['UNMATCHED', 'AMBIGUOUS'] } },
    orderBy: { createdAt: 'asc' },
  });
}
