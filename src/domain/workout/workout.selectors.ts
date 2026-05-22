import {
    WorkoutAggregate,
    WorkoutSectionAggregate,
    WorkoutSectionId,
    WorkoutSet,
    WorkoutSetId,
} from "./workout.types";

export function getAllWorkoutSets(
  workoutAggregate: WorkoutAggregate,
): WorkoutSet[] {
  return workoutAggregate.sections.flatMap(
    (sectionAggregate) => sectionAggregate.sets,
  );
}

export function getWorkoutSetById(
  workoutAggregate: WorkoutAggregate,
  setId: WorkoutSetId,
): WorkoutSet | undefined {
  return getAllWorkoutSets(workoutAggregate).find((set) => set.id === setId);
}

export function getWorkoutSectionById(
  workoutAggregate: WorkoutAggregate,
  sectionId: WorkoutSectionId,
): WorkoutSectionAggregate | undefined {
  return workoutAggregate.sections.find(
    (workoutSectionAggregate) =>
      workoutSectionAggregate.section.id === sectionId,
  );
}
