import { localCalendarDay } from "@/shared/utils/localCalendar";

import { median } from "../measurements/progress.measurements.utils";
import type { RepresentativeSet } from "../sessions/progress.sessions.types";

import type {
  DailyRepObservation,
  WorkoutRepObservations,
} from "./progress.dailyRepObservations.types";
import type { WorkoutRepObservation } from "./progress.strength.types";

type DailyRepGroup = Pick<DailyRepObservation, "family" | "day" | "reps"> & {
  workouts: Map<WorkoutRepObservations["workoutId"], WorkoutRepObservation>;
};

function compareSources(a: RepresentativeSet, b: RepresentativeSet): number {
  return (
    a.workoutFinishedAt - b.workoutFinishedAt ||
    a.workoutId.localeCompare(b.workoutId) ||
    a.setId.localeCompare(b.setId)
  );
}

/**
 * Aggregates validated Step 1 observations with one contribution per workout.
 * Repeated workout/rep inputs must describe the same selected observation.
 * Adjusted coverage is retained for later comparison decisions.
 */
export function deriveDailyRepObservations(
  workouts: readonly WorkoutRepObservations[],
): DailyRepObservation[] {
  const groups = new Map<string, DailyRepGroup>();

  for (const workout of workouts) {
    const day = localCalendarDay(workout.finishedAt);

    for (const observation of workout.observations) {
      const key = `${workout.family}:${day}:${observation.reps}`;
      let group = groups.get(key);

      if (!group) {
        group = {
          family: workout.family,
          day,
          reps: observation.reps,
          workouts: new Map(),
        };
        groups.set(key, group);
      }

      if (!group.workouts.has(workout.workoutId)) {
        group.workouts.set(workout.workoutId, observation);
      }
    }
  }

  const daily: DailyRepObservation[] = [];

  for (const group of groups.values()) {
    const rawSources: RepresentativeSet[] = [];
    const adjustedSources: RepresentativeSet[] = [];
    const adjustedEstimates: number[] = [];

    for (const observation of group.workouts.values()) {
      rawSources.push(observation.rawRepresentative);

      const adjusted = observation.adjustedRepresentative;
      const estimate = adjusted?.adjustedEstimate;

      if (
        adjusted !== null &&
        estimate !== null &&
        estimate !== undefined &&
        Number.isFinite(estimate) &&
        estimate > 0
      ) {
        adjustedSources.push(adjusted);
        adjustedEstimates.push(estimate);
      }
    }

    const rawKg = median(rawSources.map((source) => source.weight));

    if (rawKg === null) continue;

    daily.push({
      family: group.family,
      day: group.day,
      reps: group.reps,
      rawKg,
      adjustedE1rm: median(adjustedEstimates),
      workoutCount: group.workouts.size,
      adjustedWorkoutCount: adjustedSources.length,
      rawSources: rawSources.sort(compareSources),
      adjustedSources: adjustedSources.sort(compareSources),
    });
  }

  return daily.sort(
    (a, b) =>
      a.day - b.day || a.family.localeCompare(b.family) || a.reps - b.reps,
  );
}
