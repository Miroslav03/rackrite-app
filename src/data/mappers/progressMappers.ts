import type {
  ExerciseRow,
  WorkoutExerciseRow,
  WorkoutRow,
  WorkoutSetRow,
} from "@/data/db/schema";

import type { CompetitionLiftExposure } from "@/domain/progress/history/progress.history.types";

export type ProgressHistoryRow = {
  workout: Pick<WorkoutRow, "id" | "status" | "startedAt" | "finishedAt">;
  exercise: Pick<ExerciseRow, "id" | "kind" | "origin" | "liftFamily">;
  entry: Pick<
    WorkoutExerciseRow,
    "id" | "workoutId" | "exerciseId" | "orderIndex"
  >;
  set: Pick<
    WorkoutSetRow,
    | "id"
    | "workoutExerciseId"
    | "setIndex"
    | "type"
    | "weight"
    | "reps"
    | "rpe"
    | "finishedAt"
  > | null;
};

export function rowsToCompetitionLiftHistory(
  rows: readonly ProgressHistoryRow[],
): CompetitionLiftExposure[] {
  const groups = new Map<
    string,
    {
      workout: CompetitionLiftExposure["workout"];
      exercise: CompetitionLiftExposure["exercise"]; // Represesnts the exericse
      entries: Map<
        string,
        {
          exercise: CompetitionLiftExposure["entries"][number]["exercise"]; // Represents the workout exercise
          sets: CompetitionLiftExposure["entries"][number]["sets"][number][];
        }
      >;
    }
  >();

  for (const row of rows) {
    const key = JSON.stringify([row.workout.id, row.exercise.id]);

    let group = groups.get(key);

    if (!group) {
      group = {
        workout: { ...row.workout },
        exercise: { ...row.exercise },
        entries: new Map(),
      };
      groups.set(key, group);
    }

    let entry = group.entries.get(row.entry.id);

    if (!entry) {
      entry = { exercise: { ...row.entry }, sets: [] };
      group.entries.set(row.entry.id, entry);
    }

    if (row.set !== null) entry.sets.push({ ...row.set });
  }

  return [...groups.values()].map((group) => ({
    workout: group.workout,
    exercise: group.exercise,
    entries: [...group.entries.values()],
  }));
}
