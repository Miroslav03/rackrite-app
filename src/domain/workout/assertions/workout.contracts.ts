import { LiftFamily } from "@/domain/domain.types";

import { WorkoutAggregate, WorkoutSectionId } from "../workout.types";

// Depending on buisness rules this can change later if we start editing workouts in history
export function assertWorkoutIsActive(
  workoutAggregate: WorkoutAggregate,
): void {
  if (workoutAggregate.workout.status === "completed") {
    throw new Error("Completed workout cannot be edited");
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
  workoutAggregate: WorkoutAggregate,
  sectionId: WorkoutSectionId,
): void {
  const sectionExists = workoutAggregate.sections.some(
    (workoutSectionAggregate) =>
      workoutSectionAggregate.section.id === sectionId,
  );

  if (!sectionExists) {
    throw new Error("Workout section not found");
  }
}
