import type { LiftFamily, SetType } from "@/domain/domain.types";
import type {
  WorkoutAggregate,
  WorkoutExerciseId,
  WorkoutId,
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
