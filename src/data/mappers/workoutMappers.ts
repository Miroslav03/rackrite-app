import type {
  NewWorkoutRow,
  NewWorkoutSectionRow,
  NewWorkoutSetRow,
  WorkoutRow,
  WorkoutSectionRow,
  WorkoutSetRow,
} from "@/data/db/schema";

import { assertWorkoutAggregateInvariants } from "@/domain/workout/assertions/workout.invariants";
import type {
  Workout,
  WorkoutAggregate,
  WorkoutSection,
  WorkoutSectionAggregate,
  WorkoutSet,
} from "@/domain/workout/workout.types";

export function workoutToRow(workout: Workout): NewWorkoutRow {
  return {
    id: workout.id,
    sourceTemplateId: workout.sourceTemplateId,
    status: workout.status,
    activeSetId: workout.activeSetId,
    startedAt: workout.startedAt,
    finishedAt: workout.finishedAt,
    createdAt: workout.createdAt,
    updatedAt: workout.updatedAt,
  };
}

export function workoutSectionToRow(
  workoutSection: WorkoutSection,
): NewWorkoutSectionRow {
  return {
    id: workoutSection.id,
    workoutId: workoutSection.workoutId,
    variationId: workoutSection.variationId,
    liftFamily: workoutSection.liftFamily,
    notes: workoutSection.notes,
    orderIndex: workoutSection.orderIndex,
    createdAt: workoutSection.createdAt,
    updatedAt: workoutSection.updatedAt,
  };
}

export function workoutSetToRow(set: WorkoutSet): NewWorkoutSetRow {
  return {
    id: set.id,
    workoutSectionId: set.workoutSectionId,
    setIndex: set.setIndex,
    type: set.type,
    weight: set.weight,
    reps: set.reps,
    rpe: set.rpe,
    finishedAt: set.finishedAt,
    createdAt: set.createdAt,
    updatedAt: set.updatedAt,
  };
}

export function workoutRowToWorkout(workoutRow: WorkoutRow): Workout {
  return {
    id: workoutRow.id,
    sourceTemplateId: workoutRow.sourceTemplateId,
    status: workoutRow.status,
    activeSetId: workoutRow.activeSetId,
    startedAt: workoutRow.startedAt,
    finishedAt: workoutRow.finishedAt,
    createdAt: workoutRow.createdAt,
    updatedAt: workoutRow.updatedAt,
  };
}

export function workoutSectionRowToWorkoutSection(
  sectionRow: WorkoutSectionRow,
): WorkoutSection {
  return {
    id: sectionRow.id,
    workoutId: sectionRow.workoutId,
    variationId: sectionRow.variationId,
    liftFamily: sectionRow.liftFamily,
    notes: sectionRow.notes,
    orderIndex: sectionRow.orderIndex,
    createdAt: sectionRow.createdAt,
    updatedAt: sectionRow.updatedAt,
  };
}

export function workoutSetRowToWorkoutSet(setRow: WorkoutSetRow): WorkoutSet {
  return {
    id: setRow.id,
    workoutSectionId: setRow.workoutSectionId,
    setIndex: setRow.setIndex,
    type: setRow.type,
    weight: setRow.weight,
    reps: setRow.reps,
    rpe: setRow.rpe,
    finishedAt: setRow.finishedAt,
    createdAt: setRow.createdAt,
    updatedAt: setRow.updatedAt,
  };
}

export function rowsToWorkoutAggregate({
  workoutRow,
  sectionRows,
  setRows,
}: {
  workoutRow: WorkoutRow;
  sectionRows: WorkoutSectionRow[];
  setRows: WorkoutSetRow[];
}): WorkoutAggregate {
  const setsBySectionId = new Map<string, WorkoutSet[]>();

  for (const setRow of setRows) {
    const set = workoutSetRowToWorkoutSet(setRow);

    const existingSets = setsBySectionId.get(set.workoutSectionId) ?? [];
    existingSets.push(set);

    setsBySectionId.set(set.workoutSectionId, existingSets);
  }

  const sections: WorkoutSectionAggregate[] = sectionRows
    .map((sectionRow) => {
      const section = workoutSectionRowToWorkoutSection(sectionRow);

      const sets = setsBySectionId.get(section.id) ?? [];

      return {
        section,
        sets: sets.sort((a, b) => a.setIndex - b.setIndex),
      };
    })
    .sort((a, b) => a.section.orderIndex - b.section.orderIndex);

  const workoutAggregate: WorkoutAggregate = {
    workout: workoutRowToWorkout(workoutRow),
    sections,
  };

  assertWorkoutAggregateInvariants(workoutAggregate);

  return workoutAggregate;
}
