import type {
  TemplateAggregate,
  TemplateExerciseId,
  TemplateSetId,
} from "./templates.types";

export function getTemplateExerciseById(
  aggregate: TemplateAggregate,
  id: TemplateExerciseId,
) {
  return aggregate.exercises.find(
    ({ templateExercise }) => templateExercise.id === id,
  );
}

export function getTemplateExerciseBySetId(
  aggregate: TemplateAggregate,
  id: TemplateSetId,
) {
  return aggregate.exercises.find(({ sets }) =>
    sets.some((set) => set.id === id),
  );
}
