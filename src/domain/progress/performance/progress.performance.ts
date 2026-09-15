import { type ProgressConfig, progressConfig } from "../progress.config";
import { validRpe } from "./progress.performance.utils";

// Brzycki is bounded to low repetitions; its output is not a tested maximum.
export function estimateOneRepMax(
  weight: number,
  reps: number,
  config: ProgressConfig = progressConfig,
): number | null {
  if (
    !Number.isFinite(weight) ||
    weight <= 0 ||
    !Number.isInteger(reps) ||
    reps < 1 ||
    reps > config.maxEstimateReps
  )
    return null;

  const estimate = weight * (36 / (37 - reps));

  return Number.isFinite(estimate) ? estimate : null;
}

export function estimateEffortAdjustedPerformance(
  weight: number,
  reps: number,
  rpe: number | null,
  config: ProgressConfig = progressConfig,
): number | null {
  if (
    !validRpe(rpe) ||
    rpe < config.minimumPerformanceRpe ||
    !Number.isInteger(reps) ||
    reps < 1
  )
    return null;

  return estimateOneRepMax(weight, reps + 10 - rpe, config);
}

export function estimateLoadForEffort(
  capacity: number,
  reps: number,
  rpe: number,
  config: ProgressConfig = progressConfig,
): number | null {
  if (
    !validRpe(rpe) ||
    rpe < config.minimumPerformanceRpe ||
    !Number.isFinite(capacity) ||
    capacity <= 0 ||
    !Number.isInteger(reps) ||
    reps < 1
  )
    return null;

  const effectiveReps = reps + 10 - rpe;

  if (effectiveReps > config.maxEstimateReps) return null;

  return capacity * ((37 - effectiveReps) / 36);
}
