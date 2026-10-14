import { dueSchedules, markScheduleRun } from '@lmms/qbr';

/**
 * Runs hourly. Checks which report schedules match the current time and
 * dispatches them. Channel delivery is stubbed — real WhatsApp/email
 * sending lands in V2.13 or the real-integrations session.
 */
export async function reportScheduleDispatcherJob() {
  const due = await dueSchedules();
  for (const d of due) {
    try {
      // eslint-disable-next-line no-console
      console.log(
        `[report-schedule] tenant=${d.tenantId} kind=${d.kind} channel=${d.channel} recipient=${d.recipient}`,
      );
      await markScheduleRun(d.id, 'OK');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[report-schedule] tenant=${d.tenantId} error`, e);
      await markScheduleRun(d.id, 'FAILED').catch(() => undefined);
    }
  }
}
