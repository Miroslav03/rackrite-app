import { asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/data/db/client";
import {
  workoutSectionsTable,
  workoutSetsTable,
  workoutsTable,
} from "@/data/db/schema";

import {
  rowsToWorkoutAggregate,
  workoutSectionToRow,
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

// Current implementation delets and reisnerts with the right data
// Maybe this can be changed later to update what has only changed
export const saveWorkoutAggregate: WorkoutRepository["saveWorkoutAggregate"] =
  async (workoutAggregate) => {
    await db.transaction(async (tx) => {
      await tx
        .insert(workoutsTable)
        .values(workoutToRow(workoutAggregate.workout))
        .onConflictDoUpdate({
          target: workoutsTable.id,
          set: workoutToRow(workoutAggregate.workout),
        });

      const existingSections = await tx
        .select()
        .from(workoutSectionsTable)
        .where(eq(workoutSectionsTable.workoutId, workoutAggregate.workout.id));

      const existingSectionIds = existingSections.map((section) => section.id);

      if (existingSectionIds.length > 0) {
        await tx
          .delete(workoutSetsTable)
          .where(
            inArray(workoutSetsTable.workoutSectionId, existingSectionIds),
          );
      }

      await tx
        .delete(workoutSectionsTable)
        .where(eq(workoutSectionsTable.workoutId, workoutAggregate.workout.id));

      const sectionRows = workoutAggregate.sections.map((sectionAggregate) =>
        workoutSectionToRow(sectionAggregate.section),
      );

      if (sectionRows.length > 0) {
        await tx.insert(workoutSectionsTable).values(sectionRows);
      }

      const setRows = workoutAggregate.sections.flatMap((sectionAggregate) =>
        sectionAggregate.sets.map(workoutSetToRow),
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

    const sectionRows = await db
      .select()
      .from(workoutSectionsTable)
      .where(eq(workoutSectionsTable.workoutId, workoutId))
      .orderBy(asc(workoutSectionsTable.orderIndex));

    const sectionIds = sectionRows.map((section) => section.id);

    const setRows =
      sectionIds.length > 0
        ? await db
            .select()
            .from(workoutSetsTable)
            .where(inArray(workoutSetsTable.workoutSectionId, sectionIds))
            .orderBy(asc(workoutSetsTable.setIndex))
        : [];

    return rowsToWorkoutAggregate({
      workoutRow,
      sectionRows,
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
