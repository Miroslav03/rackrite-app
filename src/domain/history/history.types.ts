import type { LiftFamily, SetType } from "@/domain/domain.types";
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
  totalSets: number;
  setCounts: Record<SetType, number>;
  topSet: { weight: number; reps: number };
};

export type HistoryWorkoutSummary = {
  id: WorkoutId;
  sourceTemplateId: WorkoutAggregate["workout"]["sourceTemplateId"];
  startedAt: number;
  durationMinutes: number;
  totalWeight: number;
  liftFamilies: LiftFamily[];
  exercises: HistoryExerciseSummary[];
};

export type HistoryPage = {
  items: HistoryWorkoutSummary[];
  nextCursor: HistoryCursor | null;
};

export type HistoryWorkoutDetails = Pick<
  HistoryWorkoutSummary,
  "id" | "sourceTemplateId" | "startedAt" | "durationMinutes" | "totalWeight"
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
