import { healthScoreJob } from './jobs/health-score';
import { erpSyncJob } from './jobs/erp-sync';

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

async function healthTick() {
  await safe('health-score', healthScoreJob);
}

async function erpTick() {
  await safe('erp-sync', erpSyncJob);
}

// eslint-disable-next-line no-console
console.log('[worker] started');

void healthTick();
void erpTick();

setInterval(() => void healthTick(), ONE_DAY);
setInterval(() => void erpTick(), SIX_HOURS);
