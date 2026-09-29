import type { SetType } from "@/domain/domain.types";
import type { ExerciseKind } from "@/domain/exercises/exercise.types";
import type {
  WorkoutAggregate,
  WorkoutExerciseId,
  WorkoutId,
  WorkoutSet,
} from "@/domain/workout/workout.types";

export type HistoryCursor = {
  finishedAt: number;
  workoutId: WorkoutId;
};

export type HistoryPageRequest = {
  limit: number;
  cursor: HistoryCursor | null;
};

export type CompletedWorkoutPage = {
  workouts: WorkoutAggregate[];
  nextCursor: HistoryCursor | null;
};

export type HistoryExerciseSummary = {
  id: WorkoutExerciseId;
  name: string;
  setCounts: Record<SetType, number>;
  topSet: { weight: number; reps: number };
};

export type HistoryWorkoutSummary = {
  id: WorkoutId;
  sourceTemplateId: WorkoutAggregate["workout"]["sourceTemplateId"];
  startedAt: number;
  description: WorkoutAggregate["workout"]["description"];
  durationMinutes: number;
  totalWeight: number;
  exercises: HistoryExerciseSummary[];
};

export type HistoryPage = {
  items: HistoryWorkoutSummary[];
  nextCursor: HistoryCursor | null;
};

export type HistoryWorkoutDetails = Pick<
  HistoryWorkoutSummary,
  | "id"
  | "sourceTemplateId"
  | "startedAt"
  | "durationMinutes"
  | "totalWeight"
  | "description"
> & {
  totalSets: number;
  averageRpe: number | null;
  exercises: {
    id: WorkoutExerciseId;
    name: string;
    kind: ExerciseKind;
    sets: (Pick<WorkoutSet, "id" | "type" | "rpe"> & {
      weight: number;
      reps: number;
    })[];
  }[];
};
