import type { Exercise } from "@/domain/exercises/exercise.types";

import type {
  Template,
  TemplateExerciseId,
  TemplateSet,
} from "../editor/templates.types";

export type TemplateDetails = Pick<Template, "id" | "name" | "description"> & {
  lastExecution: { finishedAt: number } | null;
  totalSets: number;
  averageRpe: number | null;
  exercises: (Pick<Exercise, "name" | "kind"> & {
    id: TemplateExerciseId;
    sets: Pick<TemplateSet, "id" | "type" | "reps" | "rpe">[];
  })[];
};
