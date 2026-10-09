import { healthScoreJob } from './jobs/health-score';

const ONE_DAY = 24 * 60 * 60 * 1000;

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

// eslint-disable-next-line no-console
console.log('[worker] started');

// Run once on boot, then daily.
void healthTick();
setInterval(() => void healthTick(), ONE_DAY);
