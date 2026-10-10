import { healthScoreJob } from './jobs/health-score';
import { erpSyncJob } from './jobs/erp-sync';
import { retentionJob } from './jobs/retention';
import { auditIntegrityJob } from './jobs/audit-integrity';
import { erasureDueJob } from './jobs/erasure-due';

const ONE_DAY = 24 * 60 * 60 * 1000;
const SIX_HOURS = 6 * 60 * 60 * 1000;

async function safe(name: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`[worker] ${name} error`, e);
  }
}

async function healthTick() { await safe('health-score', healthScoreJob); }
async function erpTick() { await safe('erp-sync', erpSyncJob); }
async function retentionTick() { await safe('retention', retentionJob); }
async function auditTick() { await safe('audit-integrity', auditIntegrityJob); }
async function erasureTick() { await safe('erasure-due', erasureDueJob); }

// eslint-disable-next-line no-console
console.log('[worker] started');

void healthTick();
void erpTick();
void retentionTick();
void auditTick();
void erasureTick();

setInterval(() => void healthTick(), ONE_DAY);
setInterval(() => void erpTick(), SIX_HOURS);
setInterval(() => void retentionTick(), ONE_DAY);
setInterval(() => void auditTick(), ONE_DAY);
setInterval(() => void erasureTick(), ONE_DAY);
