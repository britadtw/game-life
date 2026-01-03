const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export function dayStartUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function weeklyPeriodStartUtc(params: {
  now: Date;
  weeklyStartAt: Date;
}): Date {
  const nowUtcStart = dayStartUtc(params.now);
  const anchorUtcStart = dayStartUtc(params.weeklyStartAt);

  const diff = nowUtcStart.getTime() - anchorUtcStart.getTime();
  if (diff <= 0) {
    return anchorUtcStart;
  }

  const weeks = Math.floor(diff / WEEK_MS);
  return new Date(anchorUtcStart.getTime() + weeks * WEEK_MS);
}

export function isMultipleOf7DaysUtc(params: { start: Date; end: Date }): boolean {
  const startUtc = dayStartUtc(params.start).getTime();
  const endUtc = dayStartUtc(params.end).getTime();
  const diff = endUtc - startUtc;
  return diff >= 0 && diff % WEEK_MS === 0;
}
