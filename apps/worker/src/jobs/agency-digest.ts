import { buildDailyDigest } from '@lmms/agency';

export async function agencyDigestJob() {
  try {
    const digest = await buildDailyDigest();
    // eslint-disable-next-line no-console
    console.log(
      `[agency-digest] generated at=${digest.generatedAt} sections=${digest.sections.length} totalItems=${digest.sections.reduce(
        (s, sec) => s + sec.count,
        0,
      )}`,
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[agency-digest] error', e);
  }
}
