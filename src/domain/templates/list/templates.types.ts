import type { SetType } from "@/domain/domain.types";
import type {
  Template,
  TemplateExerciseId,
} from "@/domain/templates/editor/templates.types";
import type { Workout } from "@/domain/workout/workout.types";

export type TemplateListExerciseSummary = {
  id: TemplateExerciseId;
  name: string;
  setTypes: SetType[];
};

export type TemplateListRecord = Pick<
  Template,
  "id" | "name" | "description"
> & {
  exercises: TemplateListExerciseSummary[];
  lastExecution:
    | (Pick<Workout, "startedAt"> & {
        finishedAt: NonNullable<Workout["finishedAt"]>;
      })
    | null;
};

export type TemplateListItem = Omit<TemplateListRecord, "lastExecution"> & {
  lastExecution: {
    finishedAt: NonNullable<Workout["finishedAt"]>;
    durationMinutes: number;
  } | null;
};
