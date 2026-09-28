import type { TemplateDetails } from "@/domain/templates/details/templates.types";
import { formatExerciseKind } from "@/features/exercises/view/utils/formatExerciseKind";

import type { ExerciseDetails } from "@/shared/components/ui/ExerciseDetailsCard";
import { SET_TYPE_CONFIG } from "@/shared/theme/setTypes";
import { formatRelativeDay } from "@/shared/utils/formatRelativeDay";
import { formatRpe } from "@/shared/utils/formatRpe";

export function createTemplateDetailsViewModel(
  template: TemplateDetails,
  now: number,
) {
  return {
    name: template.name,
    lastPerformed: template.lastExecution
      ? formatRelativeDay(template.lastExecution.finishedAt, now)
      : "Never",
    totalSets: String(template.totalSets),
    averageRpe: formatRpe(template.averageRpe),
    exercises: template.exercises.map((exercise): ExerciseDetails => ({
      id: exercise.id,
      name: exercise.name,
      kind: formatExerciseKind(exercise.kind),
      sets: exercise.sets.map((set, index) => ({
        id: set.id,
        number: String(index + 1).padStart(2, "0"),
        type: SET_TYPE_CONFIG[set.type],
        reps: String(set.reps),
        rpe: formatRpe(set.rpe),
      })),
    })),
  };
}
