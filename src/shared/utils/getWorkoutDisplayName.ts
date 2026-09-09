import type { Workout } from "@/domain/workout/workout.types";

export function getWorkoutDisplayName(
  sourceTemplateId: Workout["sourceTemplateId"],
): string {
  return sourceTemplateId === null ? "Quick Workout" : "Template Workout";
}
