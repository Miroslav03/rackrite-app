import { TemplateId } from "./template/domain";
import { SetType, WorkoutStatus } from "./values";
import { VariationId } from "./variation";

export type WorkoutId = string;
export type WorkoutSectionId = string;    
export type WorkoutSetId = string;    

export interface Workout {
  id: WorkoutId;
  sourceTemplateId: TemplateId | null;
  status: WorkoutStatus;
  startedAt: number;
  finishedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface WorkoutSection {
  id: WorkoutSectionId
  workoutId: WorkoutId
  variationId: VariationId;
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