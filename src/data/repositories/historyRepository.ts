import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  sql,
} from "drizzle-orm";

import { db } from "@/data/db/client";
import {
  exercisesTable,
  workoutExercisesTable,
  workoutSetsTable,
  workoutsTable,
} from "@/data/db/schema";
import { rowsToWorkoutAggregate } from "@/data/mappers/workoutMappers";

import type {
  CompletedWorkoutPage,
  HistoryPageRequest,
} from "@/domain/history/history.types";
import type { WorkoutId } from "@/domain/workout/workout.types";

export type WorkoutHistoryRepository = {
  getCompletedWorkoutPage: (
    request: HistoryPageRequest,
  ) => Promise<CompletedWorkoutPage>;
  getCompletedWorkoutCount: () => Promise<number>;
};

export const getCompletedWorkoutCount: WorkoutHistoryRepository["getCompletedWorkoutCount"] =
  async () => {
    const result = db
      .select({ total: count() })
      .from(workoutsTable)
      .where(
        and(
          eq(workoutsTable.status, "completed"),
          isNotNull(workoutsTable.finishedAt),
        ),
      )
      .get();
    return result?.total ?? 0;
  };

export const getCompletedWorkoutPage: WorkoutHistoryRepository["getCompletedWorkoutPage"] =
  async (request) => {
    const { limit, cursor } = request;

    const rows = await db
      .select()
      .from(workoutsTable)
      .where(
        and(
          and(
            eq(workoutsTable.status, "completed"),
            isNotNull(workoutsTable.finishedAt),
          ),
          cursor === null
            ? undefined
            : sql`(${workoutsTable.finishedAt}, ${workoutsTable.id}) < (${cursor.finishedAt}, ${cursor.workoutId})`,
        ),
      )
      .orderBy(desc(workoutsTable.finishedAt), desc(workoutsTable.id))
      .limit(limit + 1);

    const workoutRows = rows.slice(0, limit);
    const lastWorkout = workoutRows[workoutRows.length - 1];

    if (!lastWorkout) return { workouts: [], nextCursor: null };

    const workoutIds = workoutRows.map(({ id }) => id);

    const workoutExerciseRows = await db
      .select()
      .from(workoutExercisesTable)
      .where(inArray(workoutExercisesTable.workoutId, workoutIds))
      .orderBy(asc(workoutExercisesTable.orderIndex));

    const exerciseRows = await db
      .selectDistinct({ exercise: exercisesTable })
      .from(exercisesTable)
      .innerJoin(
        workoutExercisesTable,
        eq(workoutExercisesTable.exerciseId, exercisesTable.id),
      )
      .where(inArray(workoutExercisesTable.workoutId, workoutIds));
    // Join through the bounded workout page so parameter count cannot grow with set count.
    const setRows = await db
      .select({
        set: workoutSetsTable,
        workoutId: workoutExercisesTable.workoutId,
      })
      .from(workoutSetsTable)
      .innerJoin(
        workoutExercisesTable,
        eq(workoutSetsTable.workoutExerciseId, workoutExercisesTable.id),
      )
      .where(inArray(workoutExercisesTable.workoutId, workoutIds))
      .orderBy(asc(workoutSetsTable.setIndex));

    const exercisesByWorkout = new Map<WorkoutId, typeof workoutExerciseRows>();
    const setsByWorkout = new Map<
      WorkoutId,
      (typeof setRows)[number]["set"][]
    >();

    for (const row of workoutExerciseRows) {
      const group = exercisesByWorkout.get(row.workoutId) ?? [];
      group.push(row);
      exercisesByWorkout.set(row.workoutId, group);
    }

    for (const { set, workoutId } of setRows) {
      const group = setsByWorkout.get(workoutId) ?? [];
      group.push(set);
      setsByWorkout.set(workoutId, group);
    }

    const definitions = exerciseRows.map(({ exercise }) => exercise);
    const workouts = workoutRows.map((workoutRow) =>
      rowsToWorkoutAggregate({
        workoutRow,
        workoutExerciseRows: exercisesByWorkout.get(workoutRow.id) ?? [],
        exerciseRows: definitions,
        setRows: setsByWorkout.get(workoutRow.id) ?? [],
      }),
    );

    return {
      workouts,
      nextCursor:
        rows.length > limit && lastWorkout.finishedAt !== null
          ? { finishedAt: lastWorkout.finishedAt, workoutId: lastWorkout.id }
          : null,
    };
  };

export const workoutHistoryRepository: WorkoutHistoryRepository = {
  getCompletedWorkoutPage,
  getCompletedWorkoutCount,
};
