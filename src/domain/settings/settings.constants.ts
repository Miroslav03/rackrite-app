import type { ExerciseKind } from "@/domain/exercises/exercise.types";

export const DEFAULT_WEIGHT_INCREMENT_KG = 2.5;

export const DEFAULT_REST_SECONDS_BY_EXERCISE_KIND = {
  competition_lift: 180,
  lift_variation: 120,
  accessory: 90,
} satisfies Record<ExerciseKind, number>;
