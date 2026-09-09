import { localCalendarDay } from "@/shared/utils/localCalendar";

export function formatHistoryRelativeDay(
  startedAt: number,
  now: number,
): string {
  const days = Math.max(0, localCalendarDay(now) - localCalendarDay(startedAt));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

const performedDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const performedTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatHistoryPerformedAt(startedAt: number): string {
  return `Performed ${performedDateFormatter.format(startedAt)} · ${performedTimeFormatter.format(startedAt)}`;
}
