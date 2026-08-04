import {
    exerciseRepository,
    type ExerciseRepository,
} from "@/data/repositories/exerciseRepository";

import type { Exercise, ExerciseKind } from "@/domain/exercises/exercise.types";

export type ExerciseActions = {
  loadExercisesByKind: (kind: ExerciseKind) => Promise<Exercise[]>;
};

type CreateExerciseActionsDependencies = {
  repository: Pick<ExerciseRepository, "getExercisesByKind">;
};

export function createExerciseActions(
  dependencies: CreateExerciseActionsDependencies,
): ExerciseActions {
  return {
    loadExercisesByKind: (kind) =>
      dependencies.repository.getExercisesByKind(kind),
  };
}

export const exerciseActions = createExerciseActions({
  repository: exerciseRepository,
});
