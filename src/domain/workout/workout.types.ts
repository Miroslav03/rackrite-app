import type { SetType } from "@/domain/domain.types";
import type { Exercise, ExerciseId } from "@/domain/exercises/exercise.types";
import type { TemplateId } from "@/domain/templates/templates.types";

export type WorkoutId = string;
export type WorkoutExerciseId = string;
export type WorkoutSetId = string;

export type WorkoutStatus = "active" | "completed";

export interface Workout {
  id: WorkoutId;
  sourceTemplateId: TemplateId | null;
  status: WorkoutStatus;
  activeSetId: WorkoutSetId | null;
  restTimer: WorkoutRestTimer | null;
  startedAt: number;
  finishedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface WorkoutExercise {
  id: WorkoutExerciseId;
  workoutId: WorkoutId;
  exerciseId: ExerciseId;
  notes: string | null;
  restSeconds: number;
  orderIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface WorkoutSet {
  id: WorkoutSetId;
  workoutExerciseId: WorkoutExerciseId;
  setIndex: number;
  type: SetType;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  finishedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export type WorkoutRestTimer = {
  startedAt: number;
  endsAt: number;
};

export interface WorkoutAggregate {
  workout: Workout;
  exercises: WorkoutExerciseAggregate[];
}

export interface WorkoutExerciseAggregate {
  workoutExercise: WorkoutExercise;
  exercise: Exercise;
  sets: WorkoutSet[];
}
