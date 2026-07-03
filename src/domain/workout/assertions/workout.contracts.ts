import { LiftFamily } from "@/domain/domain.types";

import {
  WorkoutAggregate,
  WorkoutSectionAggregate,
  WorkoutSet,
} from "../workout.types";

// Depending on buisness rules this can change later if we start editing workouts in history
export function assertWorkoutIsActive(
  workoutAggregate: WorkoutAggregate,
): void {
  if (workoutAggregate.workout.status !== "active") {
    throw new Error("Workout must be active");
  }
}

export function assertWorkoutCanAddSection(
  workoutAggregate: WorkoutAggregate,
  liftFamily: LiftFamily,
): void {
  if (workoutAggregate.sections.length >= 3) {
    throw new Error("Workout cannot have more than 3 sections");
  }

  const alreadyHasLiftFamily = workoutAggregate.sections.some(
    (workoutSectionAggregate) =>
      workoutSectionAggregate.section.liftFamily === liftFamily,
  );

  if (alreadyHasLiftFamily) {
    throw new Error(`Workout already has a ${liftFamily} section`);
  }
}

export function assertWorkoutSectionExists(
  section: WorkoutSectionAggregate | undefined,
): asserts section is WorkoutSectionAggregate {
  if (!section) {
    throw new Error("Workout section not found");
  }
}

export function assertWorkoutSetExists(
  set: WorkoutSet | undefined,
): asserts set is WorkoutSet {
  if (!set) {
    throw new Error("Workout set not found");
  }
}
