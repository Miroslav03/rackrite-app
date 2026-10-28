import { localCalendarDay } from "@/shared/utils/localCalendar";

import {
  percentChange,
  unavailable,
} from "../measurements/progress.measurements";
import { median } from "../measurements/progress.measurements.utils";
import { type ProgressConfig, progressConfig } from "../progress.config";
import type { RepresentativeSet } from "../sessions/progress.sessions.types";

import type { WorkoutRepObservations } from "./progress.dailyRepObservations.types";
import type {
  DailyFallbackStrengthObservation,
  FallbackStrengthBasis,
  FallbackStrengthPeriod,
  FallbackStrengthTrend,
} from "./progress.fallbackStrength.types";
import type { RepLaneWindow } from "./progress.repLaneTrends.types";
import { assertRepLaneWindow } from "./progress.repLaneWindow";
import { compareStrengthSets } from "./progress.strength.utils";

type WorkoutRepresentatives = {
  raw: RepresentativeSet | null;
  adjusted: RepresentativeSet | null;
};

type DailyGroup = Pick<DailyFallbackStrengthObservation, "family" | "day"> & {
  workouts: Map<WorkoutRepObservations["workoutId"], WorkoutRepresentatives>;
};

function isValidEstimate(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0;
}

function selectRepresentative(
  current: RepresentativeSet | null,
  candidate: RepresentativeSet | null,
  field: "rawEstimate" | "adjustedEstimate",
): RepresentativeSet | null {
  if (candidate === null || !isValidEstimate(candidate[field])) return current;

  const currentEstimate = current?.[field] ?? -Infinity;
  return candidate[field] > currentEstimate ||
    (candidate[field] === currentEstimate &&
      current !== null &&
      compareStrengthSets(candidate, current) < 0)
    ? candidate
    : current;
}

function compareSources(a: RepresentativeSet, b: RepresentativeSet): number {
  return (
    a.workoutFinishedAt - b.workoutFinishedAt ||
    a.workoutId.localeCompare(b.workoutId) ||
    a.setId.localeCompare(b.setId)
  );
}

/**
 * Accepts validated Step 1 observations from the caller's selected history.
 * Within exact reps the highest load also has the highest raw Brzycki estimate,
 * so Step 1 retains every candidate needed for these cross-rep maxima.
 * Stored estimates reuse the existing formulas without the legacy proximity floor.
 * Repeated workout identities must have consistent lift and completion metadata.
 */
export function deriveDailyFallbackStrengthObservations(
  workouts: readonly WorkoutRepObservations[],
): DailyFallbackStrengthObservation[] {
  const groups = new Map<string, DailyGroup>();

  for (const workout of workouts) {
    const day = localCalendarDay(workout.finishedAt);
    const key = `${workout.family}:${day}`;
    let group = groups.get(key);
    if (!group) {
      group = { family: workout.family, day, workouts: new Map() };
      groups.set(key, group);
    }

    const representatives = group.workouts.get(workout.workoutId) ?? {
      raw: null,
      adjusted: null,
    };
    for (const observation of workout.observations) {
      representatives.raw = selectRepresentative(
        representatives.raw,
        observation.rawRepresentative,
        "rawEstimate",
      );
      representatives.adjusted = selectRepresentative(
        representatives.adjusted,
        observation.adjustedRepresentative,
        "adjustedEstimate",
      );
    }
    group.workouts.set(workout.workoutId, representatives);
  }

  const daily: DailyFallbackStrengthObservation[] = [];
  for (const group of groups.values()) {
    const rawSources: RepresentativeSet[] = [];
    const adjustedSources: RepresentativeSet[] = [];
    const adjustedValues: number[] = [];

    for (const { raw, adjusted } of group.workouts.values()) {
      if (raw === null) continue;
      rawSources.push(raw);
      if (adjusted !== null && isValidEstimate(adjusted.adjustedEstimate)) {
        adjustedSources.push(adjusted);
        adjustedValues.push(adjusted.adjustedEstimate);
      }
    }

    const rawE1rm = median(rawSources.map((source) => source.rawEstimate));
    if (!isValidEstimate(rawE1rm)) continue;

    daily.push({
      family: group.family,
      day: group.day,
      rawE1rm,
      adjustedE1rm: median(adjustedValues),
      workoutCount: rawSources.length,
      adjustedWorkoutCount: adjustedSources.length,
      rawSources: rawSources.sort(compareSources),
      adjustedSources: adjustedSources.sort(compareSources),
    });
  }

  return daily.sort(
    (a, b) => a.day - b.day || a.family.localeCompare(b.family),
  );
}

function summarizePeriod(
  days: readonly DailyFallbackStrengthObservation[],
  basis: FallbackStrengthBasis,
): FallbackStrengthPeriod {
  const values = days
    .map((day) => (basis === "rpe_adjusted" ? day.adjustedE1rm : day.rawE1rm))
    .filter(isValidEstimate);
  const workoutCount = days.reduce((sum, day) => sum + day.workoutCount, 0);
  const adjustedWorkoutCount = days.reduce(
    (sum, day) => sum + day.adjustedWorkoutCount,
    0,
  );
  return {
    observationCount: values.length,
    workoutCount,
    adjustedWorkoutCount,
    rpeCoverage: workoutCount > 0 ? adjustedWorkoutCount / workoutCount : 0,
    median: median(values),
  };
}

function comparePeriods(
  family: FallbackStrengthTrend["family"],
  earlier: FallbackStrengthPeriod,
  recent: FallbackStrengthPeriod,
  basis: FallbackStrengthBasis,
  config: ProgressConfig,
): FallbackStrengthTrend {
  const eligible =
    earlier.observationCount >= config.fallbackMinimumHalfDays &&
    recent.observationCount >= config.fallbackMinimumHalfDays &&
    (basis === "raw_brzycki" ||
      (earlier.rpeCoverage >= config.rpeCoverage &&
        recent.rpeCoverage >= config.rpeCoverage));

  const change = !eligible
    ? unavailable("insufficient_history")
    : isValidEstimate(earlier.median) && isValidEstimate(recent.median)
      ? percentChange(earlier.median, recent.median)
      : unavailable("invalid_baseline");

  return {
    family,
    basis,
    earlier,
    recent,
    change,
    evidenceCap: change.status === "available" ? "moderate" : null,
  };
}

/**
 * Evaluates only the requested fallback basis and explicit window. Callers own
 * history/gap selection, window maturity, method selection and final evidence.
 * Aggregating here ensures repeated workouts and rep groups cannot inflate days.
 */
export function deriveFallbackStrengthTrends(
  workouts: readonly WorkoutRepObservations[],
  window: RepLaneWindow,
  basis: FallbackStrengthBasis,
  config: ProgressConfig = progressConfig,
): FallbackStrengthTrend[] {
  assertRepLaneWindow(window);

  const startsOn = localCalendarDay(window.earlierStartsAt);
  const recentStartsOn = localCalendarDay(window.recentStartsAt);
  const endExclusiveDay = localCalendarDay(window.endExclusive);

  const families = new Map<
    FallbackStrengthTrend["family"],
    {
      earlier: DailyFallbackStrengthObservation[];
      recent: DailyFallbackStrengthObservation[];
    }
  >();

  for (const day of deriveDailyFallbackStrengthObservations(workouts)) {
    if (day.day < startsOn || day.day >= endExclusiveDay) continue;
    let periods = families.get(day.family);
    if (!periods) {
      periods = { earlier: [], recent: [] };
      families.set(day.family, periods);
    }
    (day.day < recentStartsOn ? periods.earlier : periods.recent).push(day);
  }

  return [...families.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([family, periods]) =>
      comparePeriods(
        family,
        summarizePeriod(periods.earlier, basis),
        summarizePeriod(periods.recent, basis),
        basis,
        config,
      ),
    );
}
