import type { SetType } from "@/domain/domain.types";
import type { Exercise, ExerciseId } from "@/domain/exercises/exercise.types";

export type TemplateId = string;
export type TemplateExerciseId = string;
export type TemplateSetId = string;

export interface Template {
  id: TemplateId;
  name: string;
  description: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface TemplateExercise {
  id: TemplateExerciseId;
  templateId: TemplateId;
  exerciseId: ExerciseId;
  notes: string | null;
  restSeconds: number;
  orderIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface TemplateSet {
  id: TemplateSetId;
  templateExerciseId: TemplateExerciseId;
  setIndex: number;
  type: SetType;
  reps: number;
  rpe: number | null;
  createdAt: number;
  updatedAt: number;
}

export type TemplateSetValues = Pick<TemplateSet, "type" | "reps" | "rpe">;

export interface TemplateAggregate {
  template: Template;
  exercises: TemplateExerciseAggregate[];
}

export interface TemplateExerciseAggregate {
  templateExercise: TemplateExercise;
  exercise: Exercise;
  sets: TemplateSet[];
}
