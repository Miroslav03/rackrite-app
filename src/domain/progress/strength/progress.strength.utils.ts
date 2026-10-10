import { localCalendarDay } from "@/shared/utils/localCalendar";

import { median } from "../measurements/progress.measurements.utils";
import type { RepresentativeSet } from "../sessions/progress.sessions.types";

export function weightedMedian(
  values: readonly { value: number; weight: number }[],
): number | null {
  const sortedValues = [...values]
    .filter((item) => Number.isFinite(item.value) && item.weight > 0)
    .sort((a, b) => a.value - b.value);

  const totalWeight = sortedValues.reduce((sum, item) => sum + item.weight, 0);
  const halfwayWeight = totalWeight / 2;
  let accumulatedWeight = 0;

  for (let index = 0; index < sortedValues.length; index++) {
    const current = sortedValues[index];
    const next = sortedValues[index + 1];
    accumulatedWeight += current.weight;

    if (accumulatedWeight === halfwayWeight && next) {
      // Split an exact halfway tie; halve first to avoid overflowing the sum.
      return current.value / 2 + next.value / 2;
    }

    if (accumulatedWeight >= halfwayWeight) {
      return current.value;
    }
  }

  return null;
}

// Prefer higher load, lower known RPE, later completion, then stable source IDs.
export function compareStrengthSets(
  a: RepresentativeSet,
  b: RepresentativeSet,
): number {
  const weightDifference = b.weight - a.weight;
  if (weightDifference) return weightDifference;

  const rpeDifference = (a.rpe ?? Infinity) - (b.rpe ?? Infinity);
  // Two missing RPEs produce NaN, which must fall through to the next tie-breaker.
  if (rpeDifference) return rpeDifference;

  const completionDifference = b.finishedAt - a.finishedAt;
  if (completionDifference) return completionDifference;

  const workoutDifference = a.workoutId.localeCompare(b.workoutId);
  if (workoutDifference) return workoutDifference;

  return a.setId.localeCompare(b.setId);
}

export function dailyBestSets(
  sets: readonly RepresentativeSet[],
): RepresentativeSet[] {
  const bestSetByDay = new Map<number, RepresentativeSet>();

  for (const set of sets) {
    const day = localCalendarDay(set.workoutFinishedAt);
    const currentBest = bestSetByDay.get(day);

    if (!currentBest || compareStrengthSets(set, currentBest) < 0) {
      bestSetByDay.set(day, set);
    }
  }

  return [...bestSetByDay.entries()]
    .sort(([dayA], [dayB]) => dayA - dayB)
    .map(([, set]) => set);
}

export function rpeBand(rpe: number | null): string | null {
  if (rpe === null || rpe < 7) return null;
  if (rpe <= 8) return "7-8";
  if (rpe <= 9) return "8-9";

  return "9-10";
}

export function normalizedDispersion(
  sets: readonly RepresentativeSet[],
): number {
  const medianLoad = median(sets.map((set) => set.weight));

  if (medianLoad === null || medianLoad <= 0) return Infinity;

  const absoluteDeviations = sets.map((set) =>
    Math.abs(set.weight - medianLoad),
  );
  const medianDeviation = median(absoluteDeviations) ?? 0;

  return medianDeviation / medianLoad;
}
