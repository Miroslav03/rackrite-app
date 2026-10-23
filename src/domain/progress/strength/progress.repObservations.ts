import { progressConfig } from "../progress.config";
import type { RepresentativeSet } from "../sessions/progress.sessions.types";

import type { WorkoutRepObservation } from "./progress.strength.types";
import { compareStrengthSets } from "./progress.strength.utils";

/**
 * Accepts the validated strengthSets for one competition lift in one workout.
 * Rep-specific selection does not use the legacy workout-wide raw-estimate floor.
 */
export function deriveWorkoutRepObservations(
  strengthSets: readonly RepresentativeSet[],
): WorkoutRepObservation[] {
  const observationsByReps = new Map<number, WorkoutRepObservation>();

  for (const set of strengthSets) {
    if (set.reps < 1 || set.reps > progressConfig.maxEstimateReps) {
      continue;
    }

    let observation = observationsByReps.get(set.reps);

    if (!observation) {
      observation = {
        reps: set.reps,
        rawRepresentative: set,
        adjustedRepresentative: null,
        eligibleSetCount: 0,
        adjustedEligibleSetCount: 0,
      };
      observationsByReps.set(set.reps, observation);
    }

    observation.eligibleSetCount++;

    if (compareStrengthSets(set, observation.rawRepresentative) < 0) {
      observation.rawRepresentative = set;
    }

    const adjustedEstimate = set.adjustedEstimate;

    if (
      adjustedEstimate === null ||
      !Number.isFinite(adjustedEstimate) ||
      adjustedEstimate <= 0
    ) {
      continue;
    }

    observation.adjustedEligibleSetCount++;

    const currentAdjusted = observation.adjustedRepresentative;
    const currentAdjustedEstimate =
      currentAdjusted?.adjustedEstimate ?? -Infinity;

    if (
      currentAdjusted === null ||
      adjustedEstimate > currentAdjustedEstimate ||
      (adjustedEstimate === currentAdjustedEstimate &&
        compareStrengthSets(set, currentAdjusted) < 0)
    ) {
      observation.adjustedRepresentative = set;
    }
  }

  return [...observationsByReps.values()].sort((a, b) => a.reps - b.reps);
}
