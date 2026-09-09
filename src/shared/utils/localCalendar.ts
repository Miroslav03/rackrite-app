const MILLISECONDS_PER_DAY = 86_400_000;

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
