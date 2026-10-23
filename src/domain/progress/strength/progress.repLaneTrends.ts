import { localCalendarDay } from "@/shared/utils/localCalendar";

import {
  percentChange,
  unavailable,
} from "../measurements/progress.measurements";
import { median } from "../measurements/progress.measurements.utils";
import { type ProgressConfig, progressConfig } from "../progress.config";

import type { DailyRepObservation } from "./progress.dailyRepObservations.types";
import type {
  RepLanePeriod,
  RepLaneTrend,
  RepLaneWindow,
} from "./progress.repLaneTrends.types";
import { assertRepLaneWindow } from "./progress.repLaneWindow";

type RepLane = Pick<RepLaneTrend, "family" | "reps"> & {
  earlier: DailyRepObservation[];
  recent: DailyRepObservation[];
};

function hasAdjustedValue(
  observation: DailyRepObservation,
): observation is DailyRepObservation & { adjustedE1rm: number } {
  return (
    observation.adjustedE1rm !== null &&
    Number.isFinite(observation.adjustedE1rm) &&
    observation.adjustedE1rm > 0
  );
}

function summarizePeriod(
  observations: readonly DailyRepObservation[],
): RepLanePeriod {
  const workoutCount = observations.reduce(
    (sum, day) => sum + day.workoutCount,
    0,
  );
  const adjustedWorkoutCount = observations.reduce(
    (sum, day) => sum + day.adjustedWorkoutCount,
    0,
  );

  return {
    observationCount: observations.length,
    adjustedObservationCount: observations.filter(hasAdjustedValue).length,
    workoutCount,
    adjustedWorkoutCount,
    rpeCoverage: workoutCount > 0 ? adjustedWorkoutCount / workoutCount : 0,
    median: null,
  };
}

function compareLane(lane: RepLane, config: ProgressConfig): RepLaneTrend {
  const minimumDays = config.repLaneMinimumHalfDays;

  const earlier = summarizePeriod(lane.earlier);
  const recent = summarizePeriod(lane.recent);

  if (
    earlier.observationCount < minimumDays ||
    recent.observationCount < minimumDays
  ) {
    return {
      family: lane.family,
      reps: lane.reps,
      basis: "insufficient",
      earlier,
      recent,
      change: unavailable("insufficient_history"),
    };
  }

  const basis =
    earlier.rpeCoverage >= config.rpeCoverage &&
    recent.rpeCoverage >= config.rpeCoverage &&
    earlier.adjustedObservationCount >= minimumDays &&
    recent.adjustedObservationCount >= minimumDays
      ? "rpe_adjusted"
      : "raw_load";

  const values = (observations: readonly DailyRepObservation[]) =>
    basis === "rpe_adjusted"
      ? observations.filter(hasAdjustedValue).map((day) => day.adjustedE1rm)
      : observations.map((day) => day.rawKg);

  const earlierValues = values(lane.earlier);
  const recentValues = values(lane.recent);

  const earlierMedian = median(earlierValues);
  const recentMedian = median(recentValues);

  const validValues = [...earlierValues, ...recentValues].every(
    (value) => Number.isFinite(value) && value > 0,
  );

  return {
    family: lane.family,
    reps: lane.reps,
    basis,
    earlier: { ...earlier, median: earlierMedian },
    recent: { ...recent, median: recentMedian },
    change:
      validValues && earlierMedian !== null && recentMedian !== null
        ? percentChange(earlierMedian, recentMedian)
        : unavailable("invalid_baseline"),
  };
}

/**
 * Compares unique daily observations from Step 2 within the explicit comparison
 * window. Callers supply observations from the existing history/gap selection;
 * this function neither anchors a new window nor selects a training segment.
 */
export function deriveRepLaneTrends(
  observations: readonly DailyRepObservation[],
  window: RepLaneWindow,
  config: ProgressConfig = progressConfig,
): RepLaneTrend[] {
  assertRepLaneWindow(window);
  const startsOn = localCalendarDay(window.earlierStartsAt);
  const recentStartsOn = localCalendarDay(window.recentStartsAt);
  const endExclusiveDay = localCalendarDay(window.endExclusive);

  const lanes = new Map<string, RepLane>();

  for (const observation of observations) {
    if (
      !Number.isInteger(observation.reps) ||
      observation.reps < 1 ||
      observation.reps > config.maxEstimateReps ||
      observation.day < startsOn ||
      observation.day >= endExclusiveDay
    ) {
      continue;
    }

    const key = `${observation.family}:${observation.reps}`;
    let lane = lanes.get(key);

    if (!lane) {
      lane = {
        family: observation.family,
        reps: observation.reps,
        earlier: [],
        recent: [],
      };
      lanes.set(key, lane);
    }

    const period =
      observation.day < recentStartsOn ? lane.earlier : lane.recent;
    period.push(observation);
  }

  return [...lanes.values()]
    .sort((a, b) => a.family.localeCompare(b.family) || a.reps - b.reps)
    .map((lane) => compareLane(lane, config));
}
