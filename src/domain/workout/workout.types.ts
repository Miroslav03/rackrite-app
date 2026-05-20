import { LiftFamily, SetType } from "@/domain/domain.types";
import { TemplateId } from "@/domain/templates/templates.types";
import { VariationId } from "@/domain/variations/variation.types";

export type WorkoutId = string;
export type WorkoutSectionId = string;
export type WorkoutSetId = string;

export type WorkoutStatus = "active" | "completed";

export interface Workout {
  id: WorkoutId;
  sourceTemplateId: TemplateId | null;
  status: WorkoutStatus;
  activeSetId: WorkoutSetId | null;
  startedAt: number;
  finishedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface WorkoutSection {
  id: WorkoutSectionId;
  workoutId: WorkoutId;
  variationId: VariationId;
  liftFamily: LiftFamily;
  notes: string | null;
  orderIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface WorkoutSet {
  id: WorkoutSetId;
  workoutSectionId: WorkoutSectionId;
  setIndex: number;
  type: SetType;
  weight: number | null;
  reps: number | null;
  finishedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface WorkoutAggregate {
  workout: Workout;
  sections: WorkoutSectionAggregate[];
}

export interface WorkoutSectionAggregate {
  section: WorkoutSection;
  sets: WorkoutSet[];
}
