const MILLISECONDS_PER_DAY = 86_400_000;

export function addLocalCalendarDays(timestamp: number, days: number): number {
  const date = new Date(timestamp);

  date.setDate(date.getDate() + days);

  return date.getTime();
}

export function startOfLocalWeek(timestamp: number): number {
  const day = startOfLocalDay(timestamp);

  return addLocalCalendarDays(day, -((new Date(day).getDay() + 6) % 7));
}

export function validTimestamp(value: number | null): value is number {
  return (
    value !== null &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    Number.isFinite(new Date(value).getTime())
  );
}

export function localCalendarDay(timestamp: number): number {
  const date = new Date(timestamp);

  return (
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) /
    MILLISECONDS_PER_DAY
  );
}

export function millisecondsUntilLocalMidnight(now: number): number {
  const midnight = new Date(now);

  midnight.setHours(24, 0, 0, 0);

  return Math.max(1, midnight.getTime() - now);
}

export function startOfLocalDay(timestamp: number): number {
  const date = new Date(timestamp);

  date.setHours(0, 0, 0, 0);

  return date.getTime();
}
