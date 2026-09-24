import type { Exercise } from "@/domain/exercises/exercise.types";
import type { Template } from "@/domain/templates/editor/templates.types";
import type { Workout } from "@/domain/workout/workout.types";

export type TemplateCompetitionLift = Pick<
  Extract<Exercise, { kind: "competition_lift" }>,
  "id" | "name" | "liftFamily"
>;

export type TemplateListRecord = Pick<
  Template,
  "id" | "name" | "description"
> & {
  competitionLifts: TemplateCompetitionLift[];
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
