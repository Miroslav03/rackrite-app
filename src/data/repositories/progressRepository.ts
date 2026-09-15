import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";

import { db } from "@/data/db/client";
import {
  exercisesTable as e,
  workoutSetsTable as s,
  workoutsTable as w,
  workoutExercisesTable as we,
} from "@/data/db/schema";
import { rowsToCompetitionLiftHistory } from "@/data/mappers/progressMappers";

import type { ProgressRepository } from "@/domain/progress/history/progress.history.types";

import { validTimestamp } from "@/shared/utils/localCalendar";

export const getCompletedCompetitionLiftHistory: ProgressRepository["getCompletedCompetitionLiftHistory"] =
  async (request) => {
    if (
      !validTimestamp(request.fromFinishedAt) ||
      !validTimestamp(request.throughFinishedAt) ||
      request.fromFinishedAt > request.throughFinishedAt
    )
      throw new Error("Invalid progress history bounds");

    const rows = await db
      .select({
        workout: {
          id: w.id,
          status: w.status,
          startedAt: w.startedAt,
          finishedAt: w.finishedAt,
        },
        exercise: {
          id: e.id,
          kind: e.kind,
          origin: e.origin,
          liftFamily: e.liftFamily,
        },
        entry: {
          id: we.id,
          workoutId: we.workoutId,
          exerciseId: we.exerciseId,
          orderIndex: we.orderIndex,
        },
        set: {
          id: s.id,
          workoutExerciseId: s.workoutExerciseId,
          setIndex: s.setIndex,
          type: s.type,
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
          finishedAt: s.finishedAt,
        },
      })
      .from(w)
      .innerJoin(we, eq(we.workoutId, w.id))
      .innerJoin(e, eq(e.id, we.exerciseId))
      .leftJoin(s, eq(s.workoutExerciseId, we.id))
      .where(
        and(
          eq(w.status, "completed"),
          gte(w.finishedAt, request.fromFinishedAt),
          lte(w.finishedAt, request.throughFinishedAt),
          eq(e.kind, "competition_lift"),
          eq(e.origin, "built_in"),
          inArray(e.liftFamily, ["squat", "bench", "deadlift"]),
        ),
      )
      .orderBy(
        asc(w.finishedAt),
        asc(w.id),
        asc(we.orderIndex),
        asc(we.id),
        asc(s.setIndex),
        asc(s.id),
      );

    return rowsToCompetitionLiftHistory(rows);
  };

export const progressRepository: ProgressRepository = {
  getCompletedCompetitionLiftHistory,
};
