import type { TemplateRepository } from "@/data/repositories/templateRepository";
import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import { selectTemplateDetails } from "@/domain/templates/details/templates.selectors";
import type { TemplateDetails } from "@/domain/templates/details/templates.types";
import type { TemplateId } from "@/domain/templates/editor/templates.types";

export async function loadTemplateDetails(
  dependencies: {
    templateRepository: Pick<TemplateRepository, "getTemplateAggregateById">;
    workoutRepository: Pick<
      WorkoutRepository,
      "getLatestCompletedWorkoutForTemplate"
    >;
  },
  templateId: TemplateId,
): Promise<TemplateDetails | null> {
  const template =
    await dependencies.templateRepository.getTemplateAggregateById(templateId);

  if (!template) return null;

  const previous =
    await dependencies.workoutRepository.getLatestCompletedWorkoutForTemplate(
      templateId,
    );

  const finishedAt = previous?.workout.finishedAt;

  return selectTemplateDetails(
    template,
    finishedAt == null ? null : { finishedAt },
  );
}
