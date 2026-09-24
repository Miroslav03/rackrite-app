import { localCalendarDay } from "./localCalendar";

export function formatRelativeDay(timestamp: number, now: number): string {
  const days = Math.max(0, localCalendarDay(now) - localCalendarDay(timestamp));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}
