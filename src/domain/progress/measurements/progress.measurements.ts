import type {
  Measurement,
  UnavailableReason,
} from "./progress.measurements.types";

export function available(value: number): Measurement {
  return Number.isFinite(value)
    ? { status: "available", value }
    : unavailable("invalid_baseline");
}

export function unavailable(reason: UnavailableReason): Measurement {
  return { status: "unavailable", reason };
}

export function percentChange(
  baseline: number | null,
  recent: number | null,
): Measurement {
  if (baseline === null || recent === null)
    return unavailable("insufficient_history");

  if (!Number.isFinite(baseline) || baseline <= 0)
    return unavailable("invalid_baseline");

  return available((recent / baseline - 1) * 100);
}
