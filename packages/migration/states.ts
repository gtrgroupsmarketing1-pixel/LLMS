export type TenantMode = 'STANDALONE' | 'ERP_CONNECTED' | 'UPGRADING';

export type MigrationStatus =
  | 'INITIATED'
  | 'MATCHING'
  | 'AWAITING_REVIEW'
  | 'BACKFILLING'
  | 'COMPLETED'
  | 'FAILED'
  | 'ROLLED_BACK';

const ALLOWED: Record<MigrationStatus, MigrationStatus[]> = {
  INITIATED: ['MATCHING', 'FAILED', 'ROLLED_BACK'],
  MATCHING: ['AWAITING_REVIEW', 'BACKFILLING', 'FAILED', 'ROLLED_BACK'],
  AWAITING_REVIEW: ['BACKFILLING', 'FAILED', 'ROLLED_BACK'],
  BACKFILLING: ['COMPLETED', 'FAILED', 'ROLLED_BACK'],
  COMPLETED: ['ROLLED_BACK'],
  FAILED: ['ROLLED_BACK'],
  ROLLED_BACK: [],
};

export function canTransition(from: MigrationStatus, to: MigrationStatus): boolean {
  return (ALLOWED[from] ?? []).includes(to);
}

export function assertTransition(from: MigrationStatus, to: MigrationStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`invalid_migration_transition:${from}->${to}`);
  }
}

export function assertUpgradeSource(mode: string): void {
  if (mode !== 'STANDALONE') {
    throw new Error(`invalid_upgrade_source:${mode}`);
  }
}

export function assertRollbackAllowed(status: MigrationStatus): void {
  if (status === 'ROLLED_BACK') {
    throw new Error('already_rolled_back');
  }
}
