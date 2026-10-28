import type { LiftFamily } from "@/domain/domain.types";
import {
  addLocalCalendarDays,
  localCalendarDay,
} from "@/shared/utils/localCalendar";

import type { WorkoutRepObservations } from "./progress.dailyRepObservations.types";
import type { FallbackStrengthBasis } from "./progress.fallbackStrength.types";
import type { OverallRepTrend } from "./progress.overallRepTrends.types";
import type {
  RepLaneWindow,
  RepLaneWindowMode,
} from "./progress.repLaneTrends.types";
import {
  assertRepLaneWindow,
  createRepLaneWindow,
} from "./progress.repLaneWindow";
import type {
  SelectedStrengthTrend,
  StrengthTrendCandidates,
} from "./progress.strengthTrendSelector.types";

function assertWindowMode(
  window: RepLaneWindow,
  mode: RepLaneWindowMode,
): void {
  assertRepLaneWindow(window);

  const expected = createRepLaneWindow(window.endExclusive, mode);

  if (
    window.earlierStartsAt !== expected.earlierStartsAt ||
    window.recentStartsAt !== expected.recentStartsAt
  ) {
    throw new Error("Invalid strength-trend comparison windows");
  }
}

function hasValidObservation(workout: WorkoutRepObservations): boolean {
  return workout.observations.some(
    ({ rawRepresentative }) =>
      Number.isFinite(rawRepresentative.rawEstimate) &&
      rawRepresentative.rawEstimate > 0,
  );
}

/** Requires same-lift Step 1 history in the oldest seven local days of a 42-day window. */
export function hasEstablishedLiftHistory(
  workouts: readonly WorkoutRepObservations[],
  family: LiftFamily,
  window: RepLaneWindow,
): boolean {
  assertWindowMode(window, "established");

  const startsOn = localCalendarDay(window.earlierStartsAt);
  const endsOn = localCalendarDay(
    addLocalCalendarDays(window.earlierStartsAt, 7),
  );

  return workouts.some((workout) => {
    const day = localCalendarDay(workout.finishedAt);
    return (
      workout.family === family &&
      day >= startsOn &&
      day < endsOn &&
      hasValidObservation(workout)
    );
  });
}

function isEligibleComparable(
  trend: OverallRepTrend | undefined,
  family: LiftFamily,
): trend is OverallRepTrend {
  return (
    trend !== undefined &&
    trend.family === family &&
    trend.change.status === "available" &&
    Number.isFinite(trend.change.value) &&
    trend.contributingReps.length > 0 &&
    trend.agreement !== "insufficient"
  );
}

/**
 * Chooses comparable, adjusted fallback, then raw fallback; within each method,
 * mature 42-day history precedes 28 days. Candidate magnitudes never set priority.
 * Callers own history-segment/recency selection and calculating each window's candidates.
 */
export function selectStrengthTrend(
  candidates: StrengthTrendCandidates,
): SelectedStrengthTrend {
  const { family, history, early, established } = candidates;

  assertWindowMode(early.window, "early");
  assertWindowMode(established.window, "established");

  if (early.window.endExclusive !== established.window.endExclusive) {
    throw new Error("Invalid strength-trend comparison windows");
  }

  if (
    !history.some(
      (workout) => workout.family === family && hasValidObservation(workout),
    )
  ) {
    return { method: "building_history", family };
  }

  const modes: RepLaneWindowMode[] = hasEstablishedLiftHistory(
    history,
    family,
    established.window,
  )
    ? ["established", "early"]
    : ["early"];

  for (const windowMode of modes) {
    const { window, comparable: trend } = candidates[windowMode];
    if (isEligibleComparable(trend, family)) {
      return { method: "comparable", family, windowMode, window, trend };
    }
  }

  const bases: FallbackStrengthBasis[] = ["rpe_adjusted", "raw_brzycki"];
  for (const basis of bases) {
    for (const windowMode of modes) {
      const bundle = candidates[windowMode];
      const trend =
        basis === "rpe_adjusted" ? bundle.adjustedFallback : bundle.rawFallback;
      if (
        trend !== undefined &&
        trend.family === family &&
        trend.basis === basis &&
        trend.change.status === "available" &&
        Number.isFinite(trend.change.value)
      ) {
        return {
          method:
            basis === "rpe_adjusted"
              ? "rpe_adjusted_fallback"
              : "raw_brzycki_fallback",
          family,
          windowMode,
          window: bundle.window,
          trend,
        };
      }
    }
  }

  return { method: "building_history", family };
}
