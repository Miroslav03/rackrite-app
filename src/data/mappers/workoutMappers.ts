import type {
  ExerciseRow,
  NewExerciseRow,
  NewWorkoutExerciseRow,
  NewWorkoutRow,
  NewWorkoutSetRow,
  WorkoutExerciseRow,
  WorkoutRow,
  WorkoutSetRow,
} from "@/data/db/schema";

import type { Exercise } from "@/domain/exercises/exercise.types";
import { assertWorkoutAggregateInvariants } from "@/domain/workout/assertions/workout.invariants";
import type {
  Workout,
  WorkoutAggregate,
  WorkoutExercise,
  WorkoutExerciseAggregate,
  WorkoutSet,
} from "@/domain/workout/workout.types";

export function exerciseToRow(exercise: Exercise): NewExerciseRow {
  return {
    id: exercise.id,
    name: exercise.name,
    kind: exercise.kind,
    origin: exercise.origin,
    liftFamily: exercise.liftFamily,
  };
}

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

export function workoutExerciseToRow(
  workoutExercise: WorkoutExercise,
): NewWorkoutExerciseRow {
  return {
    id: workoutExercise.id,
    workoutId: workoutExercise.workoutId,
    exerciseId: workoutExercise.exerciseId,
    notes: workoutExercise.notes,
    orderIndex: workoutExercise.orderIndex,
    createdAt: workoutExercise.createdAt,
    updatedAt: workoutExercise.updatedAt,
  };
}

export function workoutSetToRow(set: WorkoutSet): NewWorkoutSetRow {
  return {
    id: set.id,
    workoutExerciseId: set.workoutExerciseId,
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

export function exerciseRowToExercise(exerciseRow: ExerciseRow): Exercise {
  const { id, name, kind, origin, liftFamily } = exerciseRow;

  switch (kind) {
    case "competition_lift":
      if (origin !== "built_in") {
        throw new Error(
          `Invalid exercise row "${id}": competition lifts must be built in`,
        );
      }

      if (liftFamily === null) {
        throw new Error(
          `Invalid exercise row "${id}": competition lifts must have a lift family`,
        );
      }

      return { id, name, kind, origin, liftFamily };

    case "lift_variation":
      if (liftFamily === null) {
        throw new Error(
          `Invalid exercise row "${id}": lift variations must have a lift family`,
        );
      }

      return { id, name, kind, origin, liftFamily };

    case "accessory":
      if (liftFamily !== null) {
        throw new Error(
          `Invalid exercise row "${id}": accessories cannot have a lift family`,
        );
      }

      return { id, name, kind, origin, liftFamily };

    default:
      throw new Error(`Invalid exercise row "${id}": unknown kind "${kind}"`);
  }
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

export function workoutExerciseRowToWorkoutExercise(
  exerciseRow: WorkoutExerciseRow,
): WorkoutExercise {
  return {
    id: exerciseRow.id,
    workoutId: exerciseRow.workoutId,
    exerciseId: exerciseRow.exerciseId,
    notes: exerciseRow.notes,
    orderIndex: exerciseRow.orderIndex,
    createdAt: exerciseRow.createdAt,
    updatedAt: exerciseRow.updatedAt,
  };
}

export function workoutSetRowToWorkoutSet(setRow: WorkoutSetRow): WorkoutSet {
  return {
    id: setRow.id,
    workoutExerciseId: setRow.workoutExerciseId,
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
  workoutExerciseRows,
  exerciseRows,
  setRows,
}: {
  workoutRow: WorkoutRow;
  workoutExerciseRows: WorkoutExerciseRow[];
  exerciseRows: ExerciseRow[];
  setRows: WorkoutSetRow[];
}): WorkoutAggregate {
  const exercisesById = new Map(
    exerciseRows.map((exerciseRow) => {
      const exercise = exerciseRowToExercise(exerciseRow);

      return [exercise.id, exercise];
    }),
  );
  const setsByWorkoutExerciseId = new Map<string, WorkoutSet[]>();

  for (const setRow of setRows) {
    const set = workoutSetRowToWorkoutSet(setRow);
    const existingSets =
      setsByWorkoutExerciseId.get(set.workoutExerciseId) ?? [];
    existingSets.push(set);
    setsByWorkoutExerciseId.set(set.workoutExerciseId, existingSets);
  }

  const exercises: WorkoutExerciseAggregate[] = workoutExerciseRows
    .map((workoutExerciseRow) => {
      const workoutExercise =
        workoutExerciseRowToWorkoutExercise(workoutExerciseRow);
      const exercise = exercisesById.get(workoutExercise.exerciseId);

      if (!exercise) {
        throw new Error("Workout exercise definition not found");
      }

      const sets = setsByWorkoutExerciseId.get(workoutExercise.id) ?? [];

      return {
        workoutExercise,
        exercise,
        sets: sets.sort((left, right) => left.setIndex - right.setIndex),
      };
    })
    .sort(
      (left, right) =>
        left.workoutExercise.orderIndex - right.workoutExercise.orderIndex,
    );

  const workoutAggregate: WorkoutAggregate = {
    workout: workoutRowToWorkout(workoutRow),
    exercises,
  };

  assertWorkoutAggregateInvariants(workoutAggregate);

  return workoutAggregate;
}
