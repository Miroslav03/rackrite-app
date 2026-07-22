import { asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/data/db/client";
import {
  exercisesTable,
  workoutExercisesTable,
  workoutSetsTable,
  workoutsTable,
} from "@/data/db/schema";
import {
  exerciseToRow,
  rowsToWorkoutAggregate,
  workoutExerciseToRow,
  workoutSetToRow,
  workoutToRow,
} from "@/data/mappers/workoutMappers";

import type {
  WorkoutAggregate,
  WorkoutId,
} from "@/domain/workout/workout.types";

export type WorkoutRepository = {
  saveWorkoutAggregate: (workoutAggregate: WorkoutAggregate) => Promise<void>;
  getWorkoutAggregateById: (
    workoutId: WorkoutId,
  ) => Promise<WorkoutAggregate | null>;
  getActiveWorkoutAggregate: () => Promise<WorkoutAggregate | null>;
  getCompletedWorkoutAggregates: () => Promise<WorkoutAggregate[]>;
};

export const saveWorkoutAggregate: WorkoutRepository["saveWorkoutAggregate"] =
  async (workoutAggregate) => {
    await db.transaction(async (tx) => {
      const exerciseRowsById = new Map(
        workoutAggregate.exercises.map((exerciseAggregate) => [
          exerciseAggregate.exercise.id,
          exerciseToRow(exerciseAggregate.exercise),
        ]),
      );
      const exerciseRows = [...exerciseRowsById.values()];

      if (exerciseRows.length > 0) {
        await tx
          .insert(exercisesTable)
          .values(exerciseRows)
          .onConflictDoNothing();
      }

      await tx
        .insert(workoutsTable)
        .values(workoutToRow(workoutAggregate.workout))
        .onConflictDoUpdate({
          target: workoutsTable.id,
          set: workoutToRow(workoutAggregate.workout),
        });

      const existingWorkoutExercises = await tx
        .select()
        .from(workoutExercisesTable)
        .where(
          eq(workoutExercisesTable.workoutId, workoutAggregate.workout.id),
        );
      const existingWorkoutExerciseIds = existingWorkoutExercises.map(
        (workoutExercise) => workoutExercise.id,
      );

      if (existingWorkoutExerciseIds.length > 0) {
        await tx
          .delete(workoutSetsTable)
          .where(
            inArray(
              workoutSetsTable.workoutExerciseId,
              existingWorkoutExerciseIds,
            ),
          );
      }

      await tx
        .delete(workoutExercisesTable)
        .where(
          eq(workoutExercisesTable.workoutId, workoutAggregate.workout.id),
        );

      const workoutExerciseRows = workoutAggregate.exercises.map(
        (exerciseAggregate) =>
          workoutExerciseToRow(exerciseAggregate.workoutExercise),
      );

      if (workoutExerciseRows.length > 0) {
        await tx.insert(workoutExercisesTable).values(workoutExerciseRows);
      }

      const setRows = workoutAggregate.exercises.flatMap((exerciseAggregate) =>
        exerciseAggregate.sets.map(workoutSetToRow),
      );

      if (setRows.length > 0) {
        await tx.insert(workoutSetsTable).values(setRows);
      }
    });
  };

export const getWorkoutAggregateById: WorkoutRepository["getWorkoutAggregateById"] =
  async (workoutId) => {
    const workoutRow = db
      .select()
      .from(workoutsTable)
      .where(eq(workoutsTable.id, workoutId))
      .get();

    if (!workoutRow) {
      return null;
    }

    const workoutExerciseRows = await db
      .select()
      .from(workoutExercisesTable)
      .where(eq(workoutExercisesTable.workoutId, workoutId))
      .orderBy(asc(workoutExercisesTable.orderIndex));
    const workoutExerciseIds = workoutExerciseRows.map(
      (workoutExercise) => workoutExercise.id,
    );
    const exerciseIds = [
      ...new Set(
        workoutExerciseRows.map(
          (workoutExercise) => workoutExercise.exerciseId,
        ),
      ),
    ];
    const exerciseRows =
      exerciseIds.length > 0
        ? await db
            .select()
            .from(exercisesTable)
            .where(inArray(exercisesTable.id, exerciseIds))
        : [];
    const setRows =
      workoutExerciseIds.length > 0
        ? await db
            .select()
            .from(workoutSetsTable)
            .where(
              inArray(workoutSetsTable.workoutExerciseId, workoutExerciseIds),
            )
            .orderBy(asc(workoutSetsTable.setIndex))
        : [];

    return rowsToWorkoutAggregate({
      workoutRow,
      workoutExerciseRows,
      exerciseRows,
      setRows,
    });
  };

export const getActiveWorkoutAggregate: WorkoutRepository["getActiveWorkoutAggregate"] =
  async () => {
    const activeWorkoutRow = db
      .select()
      .from(workoutsTable)
      .where(eq(workoutsTable.status, "active"))
      .orderBy(desc(workoutsTable.updatedAt))
      .get();

    if (!activeWorkoutRow) {
      return null;
    }

    return getWorkoutAggregateById(activeWorkoutRow.id);
  };

export const getCompletedWorkoutAggregates: WorkoutRepository["getCompletedWorkoutAggregates"] =
  async () => {
    const completedWorkoutRows = await db
      .select()
      .from(workoutsTable)
      .where(eq(workoutsTable.status, "completed"))
      .orderBy(desc(workoutsTable.finishedAt));
    const workoutAggregates = await Promise.all(
      completedWorkoutRows.map((workoutRow) =>
        getWorkoutAggregateById(workoutRow.id),
      ),
    );

    return workoutAggregates.filter(
      (workoutAggregate): workoutAggregate is WorkoutAggregate =>
        workoutAggregate !== null,
    );
  };

export const workoutRepository: WorkoutRepository = {
  saveWorkoutAggregate,
  getWorkoutAggregateById,
  getActiveWorkoutAggregate,
  getCompletedWorkoutAggregates,
};
