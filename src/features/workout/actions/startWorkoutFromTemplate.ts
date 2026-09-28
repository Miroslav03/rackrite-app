import type { TemplateRepository } from "@/data/repositories/templateRepository";
import type { WorkoutRepository } from "@/data/repositories/workoutRepository";

import type { TemplateId } from "@/domain/templates/editor/templates.types";
import type {
  WorkoutExerciseId,
  WorkoutId,
  WorkoutSetId,
} from "@/domain/workout/workout.types";
import { createWorkoutFromTemplate } from "@/domain/workout/workout.useCases";

export type StartWorkoutFromTemplateCommand = {
  templateId: TemplateId;
  expectedActiveWorkoutId: WorkoutId | null;
};

type StartWorkoutFromTemplateDependencies = {
  templateRepository: Pick<TemplateRepository, "getTemplateAggregateById">;
  repository: Pick<
    WorkoutRepository,
    "getLatestCompletedWorkoutForTemplate" | "startWorkoutAggregate"
  >;
  now: () => number;
  createWorkoutId: () => WorkoutId;
  createWorkoutExerciseId: () => WorkoutExerciseId;
  createWorkoutSetId: () => WorkoutSetId;
};

export async function startWorkoutFromTemplate(
  dependencies: StartWorkoutFromTemplateDependencies,
  command: StartWorkoutFromTemplateCommand,
) {
  const template =
    await dependencies.templateRepository.getTemplateAggregateById(
      command.templateId,
    );

  if (!template) throw new Error("The template is no longer available");

  const previous =
    await dependencies.repository.getLatestCompletedWorkoutForTemplate(
      command.templateId,
    );

  const workout = createWorkoutFromTemplate(template, previous, {
    id: dependencies.createWorkoutId(),
    now: dependencies.now(),
    createWorkoutExerciseId: dependencies.createWorkoutExerciseId,
    createWorkoutSetId: dependencies.createWorkoutSetId,
  });

  await dependencies.repository.startWorkoutAggregate(
    workout,
    command.expectedActiveWorkoutId,
  );

  return workout;
}
