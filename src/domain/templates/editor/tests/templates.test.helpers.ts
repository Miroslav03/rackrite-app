import type { Exercise } from "@/domain/exercises/exercise.types";

import type { TemplateAggregate } from "../templates.types";

import { barbellRow, competitionBench } from "./templates.test.constants";

export function createTemplate(
  id = "template_1",
  definitions: Exercise[] = [competitionBench, barbellRow],
): TemplateAggregate {
  return {
    template: {
      id,
      name: "Bench day",
      description: null,
      createdAt: 1000,
      updatedAt: 1000,
    },
    exercises: definitions.map((exercise, orderIndex) => {
      const exerciseId = `${id}_exercise_${orderIndex}`;

      return {
        exercise: { ...exercise },
        templateExercise: {
          id: exerciseId,
          templateId: id,
          exerciseId: exercise.id,
          notes: null,
          restSeconds: 180,
          orderIndex,
          createdAt: 1000,
          updatedAt: 1000,
        },
        sets: [0, 1].map((setIndex) => ({
          id: `${exerciseId}_set_${setIndex}`,
          templateExerciseId: exerciseId,
          setIndex,
          type: "working",
          reps: 5,
          rpe: null,
          createdAt: 1000,
          updatedAt: 1000,
        })),
      };
    }),
  };
}

export function freezeTemplate(
  aggregate: TemplateAggregate,
): TemplateAggregate {
  Object.freeze(aggregate.template);

  for (const entry of aggregate.exercises) {
    Object.freeze(entry.templateExercise);
    Object.freeze(entry.exercise);

    entry.sets.forEach(Object.freeze);

    Object.freeze(entry.sets);
    Object.freeze(entry);
  }

  Object.freeze(aggregate.exercises);

  return Object.freeze(aggregate);
}
