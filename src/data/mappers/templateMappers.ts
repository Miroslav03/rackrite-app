import type {
  ExerciseRow,
  NewTemplateExerciseRow,
  NewTemplateRow,
  NewTemplateSetRow,
  TemplateExerciseRow,
  TemplateRow,
  TemplateSetRow,
} from "@/data/db/schema";
import { exerciseRowToExercise } from "@/data/mappers/exerciseMappers";

import { assertTemplateCanBeSaved } from "@/domain/templates/assertions/templates.contracts";
import type {
  Template,
  TemplateAggregate,
  TemplateExercise,
  TemplateSet,
} from "@/domain/templates/templates.types";

export function templateToRow(template: Template): NewTemplateRow {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

export function templateRowToTemplate(row: TemplateRow): Template {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function templateExerciseToRow(
  exercise: TemplateExercise,
): NewTemplateExerciseRow {
  return {
    id: exercise.id,
    templateId: exercise.templateId,
    exerciseId: exercise.exerciseId,
    notes: exercise.notes,
    restSeconds: exercise.restSeconds,
    orderIndex: exercise.orderIndex,
    createdAt: exercise.createdAt,
    updatedAt: exercise.updatedAt,
  };
}

export function templateExerciseRowToTemplateExercise(
  row: TemplateExerciseRow,
): TemplateExercise {
  return {
    id: row.id,
    templateId: row.templateId,
    exerciseId: row.exerciseId,
    notes: row.notes,
    restSeconds: row.restSeconds,
    orderIndex: row.orderIndex,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function templateSetToRow(set: TemplateSet): NewTemplateSetRow {
  return {
    id: set.id,
    templateExerciseId: set.templateExerciseId,
    setIndex: set.setIndex,
    type: set.type,
    reps: set.reps,
    rpe: set.rpe,
    createdAt: set.createdAt,
    updatedAt: set.updatedAt,
  };
}

export function templateSetRowToTemplateSet(row: TemplateSetRow): TemplateSet {
  return {
    id: row.id,
    templateExerciseId: row.templateExerciseId,
    setIndex: row.setIndex,
    type: row.type,
    reps: row.reps,
    rpe: row.rpe,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function rowsToTemplateAggregate({
  templateRow,
  templateExerciseRows,
  exerciseRows,
  setRows,
}: {
  templateRow: TemplateRow;
  templateExerciseRows: TemplateExerciseRow[];
  exerciseRows: ExerciseRow[];
  setRows: TemplateSetRow[];
}): TemplateAggregate {
  const definitions = new Map(
    exerciseRows.map((row) => [row.id, exerciseRowToExercise(row)]),
  );
  const exerciseIds = new Set(templateExerciseRows.map(({ id }) => id));
  const setsByExerciseId = new Map<string, TemplateSet[]>();

  for (const row of setRows) {
    if (!exerciseIds.has(row.templateExerciseId)) {
      throw new Error("Template set must belong to an aggregate exercise");
    }

    const sets = setsByExerciseId.get(row.templateExerciseId) ?? [];
    sets.push(templateSetRowToTemplateSet(row));
    setsByExerciseId.set(row.templateExerciseId, sets);
  }

  const exercises = templateExerciseRows
    .map((row) => {
      const exercise = definitions.get(row.exerciseId);

      if (!exercise) throw new Error("Template exercise definition not found");

      return {
        templateExercise: templateExerciseRowToTemplateExercise(row),
        exercise,
        sets: (setsByExerciseId.get(row.id) ?? []).sort(
          (left, right) => left.setIndex - right.setIndex,
        ),
      };
    })
    .sort(
      (left, right) =>
        left.templateExercise.orderIndex - right.templateExercise.orderIndex,
    );

  const aggregate = { template: templateRowToTemplate(templateRow), exercises };

  assertTemplateCanBeSaved(aggregate);
  return aggregate;
}
