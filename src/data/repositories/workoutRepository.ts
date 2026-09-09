import {
  asc,
  desc,
  eq,
  inArray
} from "drizzle-orm";

import { db } from "@/data/db/client";
import {
  exercisesTable,
  workoutExercisesTable,
  workoutSetsTable,
  workoutsTable,
} from "@/data/db/schema";
import {
  rowsToWorkoutAggregate,
  workoutExerciseToRow,
  workoutSetToRow,
  workoutToRow,
} from "@/data/mappers/workoutMappers";

import type {
  WorkoutAggregate,
  WorkoutId,
} from "@/domain/workout/workout.types";
import { diffRowsById, haveSamePersistedRowValues } from "../utils";

export type WorkoutRepository = {
  insertWorkoutAggregate: (workout: WorkoutAggregate) => Promise<void>;
  deleteWorkoutAggregate: (workoutId: WorkoutId) => Promise<void>;
  updateWorkoutAggregate: (
    previous: WorkoutAggregate,
    next: WorkoutAggregate,
  ) => Promise<void>;
  getWorkoutAggregateById: (
    workoutId: WorkoutId,
  ) => Promise<WorkoutAggregate | null>;
  getActiveWorkoutAggregate: () => Promise<WorkoutAggregate | null>;
};

export const insertWorkoutAggregate: WorkoutRepository["insertWorkoutAggregate"] =
  async (workoutAggregate) => {
    const workoutExerciseRows = workoutAggregate.exercises.map(
      ({ workoutExercise }) => workoutExerciseToRow(workoutExercise),
    );

    const workoutSetRows = workoutAggregate.exercises.flatMap(({ sets }) =>
      sets.map(workoutSetToRow),
    );

    await db.transaction(async (tx) => {
      await tx
        .insert(workoutsTable)
        .values(workoutToRow(workoutAggregate.workout));

      if (workoutExerciseRows.length > 0) {
        await tx.insert(workoutExercisesTable).values(workoutExerciseRows);
      }

      if (workoutSetRows.length > 0) {
        await tx.insert(workoutSetsTable).values(workoutSetRows);
      }
    });
  };

export const deleteWorkoutAggregate: WorkoutRepository["deleteWorkoutAggregate"] =
  async (workoutId) => {
    await db.delete(workoutsTable).where(eq(workoutsTable.id, workoutId));
  };

export const updateWorkoutAggregate: WorkoutRepository["updateWorkoutAggregate"] =
  async (previousAggregate, nextAggregate) => {
    if (previousAggregate.workout.id !== nextAggregate.workout.id) {
      throw new Error("Cannot update a workout using a different workout ID");
    }

    if (previousAggregate === nextAggregate) return;

    const previousWorkoutRow = workoutToRow(previousAggregate.workout);
    const nextWorkoutRow = workoutToRow(nextAggregate.workout);

    const workoutChanged = !haveSamePersistedRowValues(
      previousWorkoutRow,
      nextWorkoutRow,
    );

    const previousWorkoutExerciseRows = previousAggregate.exercises.map(
      ({ workoutExercise }) => workoutExerciseToRow(workoutExercise),
    );
    const nextWorkoutExerciseRows = nextAggregate.exercises.map(
      ({ workoutExercise }) => workoutExerciseToRow(workoutExercise),
    );

    const workoutExerciseChanges = diffRowsById(
      previousWorkoutExerciseRows,
      nextWorkoutExerciseRows,
    );

    const previousWorkoutSetRows = previousAggregate.exercises.flatMap(
      ({ sets }) => sets.map(workoutSetToRow),
    );
    const nextWorkoutSetRows = nextAggregate.exercises.flatMap(({ sets }) =>
      sets.map(workoutSetToRow),
    );

    const workoutSetChanges = diffRowsById(
      previousWorkoutSetRows,
      nextWorkoutSetRows,
    );

    const hasWorkoutExerciseChanges =
      workoutExerciseChanges.inserted.length > 0 ||
      workoutExerciseChanges.updated.length > 0 ||
      workoutExerciseChanges.deleted.length > 0;

    const hasWorkoutSetChanges =
      workoutSetChanges.inserted.length > 0 ||
      workoutSetChanges.updated.length > 0 ||
      workoutSetChanges.deleted.length > 0;

    if (
      !workoutChanged &&
      !hasWorkoutExerciseChanges &&
      !hasWorkoutSetChanges
    ) {
      return;
    }

    const deletedWorkoutExerciseIds = new Set(
      workoutExerciseChanges.deleted.map(({ id }) => id),
    );

    // Sets belonging to deleted workout exercises will be removed by
    // ON DELETE CASCADE, so they do not need a separate DELETE.
    const workoutSetRowsToDeleteExplicitly = workoutSetChanges.deleted.filter(
      ({ workoutExerciseId }) =>
        !deletedWorkoutExerciseIds.has(workoutExerciseId),
    );

    await db.transaction(async (tx) => {
      if (workoutChanged) {
        const { id, ...values } = nextWorkoutRow;

        await tx
          .update(workoutsTable)
          .set(values)
          .where(eq(workoutsTable.id, id));
      }

      if (workoutExerciseChanges.inserted.length > 0) {
        await tx
          .insert(workoutExercisesTable)
          .values(workoutExerciseChanges.inserted);
      }

      if (workoutSetChanges.inserted.length > 0) {
        await tx.insert(workoutSetsTable).values(workoutSetChanges.inserted);
      }

      for (const workoutExerciseRow of workoutExerciseChanges.updated) {
        const { id, ...values } = workoutExerciseRow;

        await tx
          .update(workoutExercisesTable)
          .set(values)
          .where(eq(workoutExercisesTable.id, id));
      }

      for (const workoutSetRow of workoutSetChanges.updated) {
        const { id, ...values } = workoutSetRow;

        await tx
          .update(workoutSetsTable)
          .set(values)
          .where(eq(workoutSetsTable.id, id));
      }

      if (workoutSetRowsToDeleteExplicitly.length > 0) {
        await tx.delete(workoutSetsTable).where(
          inArray(
            workoutSetsTable.id,
            workoutSetRowsToDeleteExplicitly.map(({ id }) => id),
          ),
        );
      }

      if (workoutExerciseChanges.deleted.length > 0) {
        await tx.delete(workoutExercisesTable).where(
          inArray(
            workoutExercisesTable.id,
            workoutExerciseChanges.deleted.map(({ id }) => id),
          ),
        );
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

export const workoutRepository: WorkoutRepository = {
  insertWorkoutAggregate,
  deleteWorkoutAggregate,
  updateWorkoutAggregate,
  getWorkoutAggregateById,
  getActiveWorkoutAggregate,
};
