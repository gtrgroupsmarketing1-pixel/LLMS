import { healthScoreJob } from './jobs/health-score';
import { erpSyncJob } from './jobs/erp-sync';
import { retentionJob } from './jobs/retention';
import { auditIntegrityJob } from './jobs/audit-integrity';
import { erasureDueJob } from './jobs/erasure-due';
import { automationRunnerJob } from './jobs/automation-runner';
import { killSwitchEnforcerJob } from './jobs/kill-switch-enforcer';
import { monthlyReportJob } from './jobs/monthly-report';
import { weeklySummaryJob } from './jobs/weekly-summary';
import { contentPublishJob } from './jobs/content-publish';
import { approvalLinkSweeperJob } from './jobs/approval-link-sweeper';
import { migrationWatchdogJob } from './jobs/migration-watchdog';
import { journeyRunnerJob } from './jobs/journey-runner';
import { journeyKillEnforcerJob } from './jobs/journey-kill-enforcer';
import { contentApprovalReminderJob } from './jobs/content-approval-reminder';
import { approvalExpirySweeperJob } from './jobs/approval-expiry-sweeper';
import { gbpSyncJob } from './jobs/gbp-sync';

const ONE_DAY = 24 * 60 * 60 * 1000;
const SIX_HOURS = 6 * 60 * 60 * 1000;
const FIVE_MIN = 5 * 60 * 1000;
const ONE_MIN = 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

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
async function automationTick() { await safe('automation-runner', automationRunnerJob); }
async function killTick() { await safe('kill-switch-enforcer', killSwitchEnforcerJob); }
async function contentTick() { await safe('content-publish', contentPublishJob); }
async function approvalSweepTick() { await safe('approval-link-sweeper', approvalLinkSweeperJob); }
async function migrationWatchdogTick() { await safe('migration-watchdog', migrationWatchdogJob); }
async function journeyTick() { await safe('journey-runner', journeyRunnerJob); }
async function journeyKillTick() { await safe('journey-kill-enforcer', journeyKillEnforcerJob); }
async function approvalReminderTick() { await safe('content-approval-reminder', contentApprovalReminderJob); }
async function expirySweepTick() { await safe('approval-expiry-sweeper', approvalExpirySweeperJob); }
async function gbpTick() { await safe('gbp-sync', gbpSyncJob); }

async function monthlyGuard() {
  const now = new Date();
  if (now.getUTCHours() === 2) await safe('monthly-report', monthlyReportJob);
}

async function weeklyGuard() {
  const now = new Date();
  if (now.getUTCDay() === 1 && now.getUTCHours() === 6) {
    await safe('weekly-summary', weeklySummaryJob);
  }
}

// eslint-disable-next-line no-console
console.log('[worker] started');

void healthTick();
void erpTick();
void retentionTick();
void auditTick();
void erasureTick();
void automationTick();
void killTick();
void contentTick();
void approvalSweepTick();
void migrationWatchdogTick();
void journeyTick();
void journeyKillTick();
void approvalReminderTick();
void expirySweepTick();
void gbpTick();

setInterval(() => void healthTick(), ONE_DAY);
setInterval(() => void erpTick(), SIX_HOURS);
setInterval(() => void retentionTick(), ONE_DAY);
setInterval(() => void auditTick(), ONE_DAY);
setInterval(() => void erasureTick(), ONE_DAY);
setInterval(() => void automationTick(), FIVE_MIN);
setInterval(() => void killTick(), ONE_MIN);
setInterval(() => void contentTick(), ONE_MIN);
setInterval(() => void approvalSweepTick(), ONE_HOUR);
setInterval(() => void migrationWatchdogTick(), ONE_HOUR);
setInterval(() => void journeyTick(), ONE_MIN);
setInterval(() => void journeyKillTick(), ONE_MIN);
setInterval(() => void approvalReminderTick(), ONE_HOUR);
setInterval(() => void expirySweepTick(), ONE_HOUR);
setInterval(() => void gbpTick(), ONE_DAY);
setInterval(() => void monthlyGuard(), ONE_HOUR);
setInterval(() => void weeklyGuard(), ONE_HOUR);
