export interface Period {
  start: Date;
  end: Date;
}

export function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export function endOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

export function startOfISOWeek(d: Date): Date {
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
  return startOfDayUTC(monday);
}

export function endOfISOWeek(d: Date): Date {
  const start = startOfISOWeek(d);
  return endOfDayUTC(new Date(start.getTime() + 6 * 86_400_000));
}

export function startOfMonthUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

export function endOfMonthUTC(d: Date): Date {
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  return endOfDayUTC(lastDay);
}

export function lastCompletedWeek(reference: Date = new Date()): Period {
  const prev = new Date(reference.getTime() - 7 * 86_400_000);
  return { start: startOfISOWeek(prev), end: endOfISOWeek(prev) };
}

export function lastCompletedMonth(reference: Date = new Date()): Period {
  const prev = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - 1, 15));
  return { start: startOfMonthUTC(prev), end: endOfMonthUTC(prev) };
}
