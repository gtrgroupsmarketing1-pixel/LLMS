import type { Kpis } from '@lmms/reporting';

export interface KpiDelta {
  key: string;
  current: number | null;
  previous: number | null;
  changePercent: number | null;
  direction: 'up' | 'down' | 'flat' | 'new';
}

const TRACKED: Array<keyof Kpis> = [
  'campaignsSent',
  'messagesSent',
  'deliveryRate',
  'readRate',
  'replyRate',
  'optOutRate',
  'attributedRevenue',
  'attributedOrders',
  'commercialContractsSigned',
  'reviewsNew',
  'averageRating',
];

export function compareKpis(current: Kpis, previous: Kpis): KpiDelta[] {
  const results: KpiDelta[] = [];
  for (const key of TRACKED) {
    const cur = current[key] as number | null | undefined;
    const prev = previous[key] as number | null | undefined;
    if (cur == null && prev == null) continue;

    if (cur == null) {
      results.push({ key: String(key), current: null, previous: prev ?? null, changePercent: null, direction: 'down' });
      continue;
    }
    if (prev == null || prev === 0) {
      results.push({ key: String(key), current: cur, previous: prev ?? null, changePercent: null, direction: 'new' });
      continue;
    }
    const changePercent = Math.round(((cur - prev) / prev) * 10000) / 100;
    let direction: KpiDelta['direction'] = 'flat';
    if (changePercent > 1) direction = 'up';
    else if (changePercent < -1) direction = 'down';
    results.push({
      key: String(key),
      current: cur,
      previous: prev,
      changePercent,
      direction,
    });
  }
  return results;
}
