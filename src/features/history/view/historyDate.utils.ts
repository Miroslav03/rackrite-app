export { formatRelativeDay as formatHistoryRelativeDay } from "@/shared/utils/formatRelativeDay";

export const performedDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export const performedTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export const weightFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export function formatHistoryPerformedAt(startedAt: number): string {
  return `Performed ${performedDateFormatter.format(startedAt)} · ${performedTimeFormatter.format(startedAt)}`;
}
