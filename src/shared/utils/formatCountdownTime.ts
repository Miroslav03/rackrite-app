const MILLISECONDS_PER_SECOND = 1_000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

function padTimeSegment(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatCountdownTime(remainingMilliseconds: number): string {
  const totalSeconds = Math.max(
    0,
    Math.ceil(remainingMilliseconds / MILLISECONDS_PER_SECOND),
  );
  const hours = Math.floor(
    totalSeconds / (SECONDS_PER_MINUTE * MINUTES_PER_HOUR),
  );
  const minutes = Math.floor(
    (totalSeconds / SECONDS_PER_MINUTE) % MINUTES_PER_HOUR,
  );
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  if (hours > 0) {
    return `${hours}:${padTimeSegment(minutes)}:${padTimeSegment(seconds)}`;
  }

  return `${minutes}:${padTimeSegment(seconds)}`;
}
