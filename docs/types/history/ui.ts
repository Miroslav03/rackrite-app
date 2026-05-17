import { LiftFamily, SetType } from "../values";
import { VariationId } from "../variation";
import { WorkoutId, WorkoutSectionId, WorkoutSetId } from "../workout";
import { HistoryWorkoutSummaryMetrics } from "./metrics";

export interface HistoryWorkoutItem {
  workoutId: WorkoutId
  workoutName: string | null;
  liftFamilies: LiftFamily[];
  topSetSummary: string | null;
  hasPR:boolean 
  completedAt: number;
}

export interface HistoryGroup {
  label: string;
  items: HistoryWorkoutItem[];
}

export interface HistoryWorkoutDetails {
  workoutId: WorkoutId;
  completedAt: number;
  workoutName: string | null;
  durationSec: number | null;
  summary: HistoryWorkoutSummaryMetrics;
  sections: HistoryWorkoutDetailsSection[];
}

export interface HistoryWorkoutDetailsSection {
  sectionId: WorkoutSectionId;
  family: LiftFamily;
  variationId: VariationId;
  variationName: string;
  notes: string | null;
  sets: HistoryWorkoutDetailsSet[];
}

export interface HistoryWorkoutDetailsSet {
  setId: WorkoutSetId;
  setIndex: number;
  type: SetType;
  weight: number | null;
  reps: number | null;
  hasPR: boolean;
}