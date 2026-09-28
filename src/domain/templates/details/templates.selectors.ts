import type { TemplateAggregate } from "../editor/templates.types";

import type { TemplateDetails } from "./templates.types";

export function selectTemplateDetails(
  aggregate: TemplateAggregate,
  lastExecution: TemplateDetails["lastExecution"],
): TemplateDetails {
  const exercises = aggregate.exercises.map(
    ({ templateExercise, exercise, sets }) => ({
      id: templateExercise.id,
      name: exercise.name,
      kind: exercise.kind,
      sets: sets.map(({ id, type, reps, rpe }) => ({ id, type, reps, rpe })),
    }),
  );

  const sets = exercises.flatMap((exercise) => exercise.sets);
  const ratedSets = sets.filter(
    (set) => set.type !== "warmup" && set.rpe !== null,
  );

  return {
    id: aggregate.template.id,
    name: aggregate.template.name,
    lastExecution,
    totalSets: sets.length,
    averageRpe:
      ratedSets.length === 0
        ? null
        : ratedSets.reduce((sum, set) => sum + (set.rpe ?? 0), 0) /
          ratedSets.length,
    exercises,
  };
}
