import type { ExerciseKind } from "@/domain/exercises/exercise.types";

const exerciseKindLabels = {
  competition_lift: "Competition Lift",
  lift_variation: "Lift Variation",
  accessory: "Accessory",
} satisfies Record<ExerciseKind, string>;

export function formatExerciseKind(kind: ExerciseKind): string {
  return exerciseKindLabels[kind];
}
