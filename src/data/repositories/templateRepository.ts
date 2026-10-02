import { and, asc, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";

import { db } from "@/data/db/client";
import {
  exercisesTable,
  templateExercisesTable,
  templateSetsTable,
  templatesTable,
  workoutsTable,
} from "@/data/db/schema";
import {
  rowsToTemplateAggregate,
  templateExerciseToRow,
  templateRowToTemplate,
  templateSetToRow,
  templateToRow,
} from "@/data/mappers/templateMappers";
import { diffRowsById, haveSamePersistedRowValues } from "@/data/utils";

import { assertTemplateCanBeSaved } from "@/domain/templates/editor/assertions/templates.contracts";
import {
  Template,
  TemplateAggregate,
  TemplateExerciseId,
  TemplateId,
} from "@/domain/templates/editor/templates.types";
import type {
  TemplateListExerciseSummary,
  TemplateListRecord,
} from "@/domain/templates/list/templates.types";

export type TemplateRepository = {
  getTemplates: () => Promise<Template[]>;
  getTemplateAggregateById: (
    id: TemplateId,
  ) => Promise<TemplateAggregate | null>;
  insertTemplateAggregate: (aggregate: TemplateAggregate) => Promise<void>;
  updateTemplateAggregate: (
    previous: TemplateAggregate,
    next: TemplateAggregate,
  ) => Promise<void>;
  deleteTemplateAggregate: (id: TemplateId) => Promise<void>;
  getTemplateList: () => Promise<TemplateListRecord[]>;
};

export const getTemplateList: TemplateRepository["getTemplateList"] =
  async () =>
    db.transaction((tx) => {
      const executions = tx
        .select({
          templateId: workoutsTable.sourceTemplateId,
          startedAt: workoutsTable.startedAt,
          finishedAt: workoutsTable.finishedAt,
          rank: sql<number>`row_number() over (
          partition by ${workoutsTable.sourceTemplateId}
          order by ${workoutsTable.finishedAt} desc, ${workoutsTable.id} desc
        )`.as("execution_rank"),
        })
        .from(workoutsTable)
        .where(
          and(
            eq(workoutsTable.status, "completed"),
            isNotNull(workoutsTable.finishedAt),
            isNotNull(workoutsTable.sourceTemplateId),
          ),
        )
        .as("executions");

      const templates = tx
        .select({
          id: templatesTable.id,
          name: templatesTable.name,
          description: templatesTable.description,
          startedAt: executions.startedAt,
          finishedAt: executions.finishedAt,
        })
        .from(templatesTable)
        .leftJoin(
          executions,
          and(
            eq(templatesTable.id, executions.templateId),
            eq(executions.rank, 1),
          ),
        )
        .orderBy(desc(templatesTable.updatedAt), desc(templatesTable.id))
        .all();

      if (templates.length === 0) return [];

      const exerciseRows = tx
        .selectDistinct({
          templateId: templateExercisesTable.templateId,
          id: templateExercisesTable.id,
          name: exercisesTable.name,
          setType: templateSetsTable.type,
        })
        .from(templateExercisesTable)
        .innerJoin(
          exercisesTable,
          eq(templateExercisesTable.exerciseId, exercisesTable.id),
        )
        .leftJoin(
          templateSetsTable,
          eq(templateSetsTable.templateExerciseId, templateExercisesTable.id),
        )
        .orderBy(asc(templateExercisesTable.orderIndex))
        .all();

      const exercisesByTemplate = new Map<
        TemplateId,
        Map<TemplateExerciseId, TemplateListExerciseSummary>
      >();

      for (const row of exerciseRows) {
        const exercises =
          exercisesByTemplate.get(row.templateId) ??
          new Map<TemplateExerciseId, TemplateListExerciseSummary>();

        const exercise: TemplateListExerciseSummary = exercises.get(row.id) ?? {
          id: row.id,
          name: row.name,
          setTypes: [],
        };

        if (row.setType !== null) exercise.setTypes.push(row.setType);

        exercises.set(row.id, exercise);
        exercisesByTemplate.set(row.templateId, exercises);
      }

      return templates.map(
        ({ id, name, description, startedAt, finishedAt }) => ({
          id,
          name,
          description,
          exercises: [...(exercisesByTemplate.get(id)?.values() ?? [])],
          lastExecution:
            startedAt !== null && finishedAt !== null
              ? { startedAt, finishedAt }
              : null,
        }),
      );
    });

export const getTemplates: TemplateRepository["getTemplates"] = async () => {
  return db
    .select()
    .from(templatesTable)
    .orderBy(desc(templatesTable.updatedAt), desc(templatesTable.id))
    .all()
    .map(templateRowToTemplate);
};

export const getTemplateAggregateById: TemplateRepository["getTemplateAggregateById"] =
  async (id) => {
    const templateRow = db
      .select()
      .from(templatesTable)
      .where(eq(templatesTable.id, id))
      .get();

    if (!templateRow) return null;

    const templateExerciseRows = db
      .select()
      .from(templateExercisesTable)
      .where(eq(templateExercisesTable.templateId, id))
      .orderBy(asc(templateExercisesTable.orderIndex))
      .all();

    const exerciseIds = [
      ...new Set(templateExerciseRows.map((row) => row.exerciseId)),
    ];
    const exerciseRows =
      exerciseIds.length === 0
        ? []
        : db
            .select()
            .from(exercisesTable)
            .where(inArray(exercisesTable.id, exerciseIds))
            .all();

    const templateExerciseIds = templateExerciseRows.map((row) => row.id);
    const setRows =
      templateExerciseIds.length === 0
        ? []
        : db
            .select()
            .from(templateSetsTable)
            .where(
              inArray(
                templateSetsTable.templateExerciseId,
                templateExerciseIds,
              ),
            )
            .orderBy(asc(templateSetsTable.setIndex))
            .all();

    return rowsToTemplateAggregate({
      templateRow,
      templateExerciseRows,
      exerciseRows,
      setRows,
    });
  };

export const insertTemplateAggregate: TemplateRepository["insertTemplateAggregate"] =
  async (aggregate) => {
    assertTemplateCanBeSaved(aggregate);
    // The Expo driver commits when this callback returns; all statements must finish synchronously.
    db.transaction((tx) => {
      tx.insert(templatesTable).values(templateToRow(aggregate.template)).run();

      tx.insert(templateExercisesTable)
        .values(
          aggregate.exercises.map(({ templateExercise }) =>
            templateExerciseToRow(templateExercise),
          ),
        )
        .run();

      tx.insert(templateSetsTable)
        .values(
          aggregate.exercises.flatMap(({ sets }) => sets.map(templateSetToRow)),
        )
        .run();
    });
  };

export const updateTemplateAggregate: TemplateRepository["updateTemplateAggregate"] =
  async (previous, next) => {
    if (previous.template.id !== next.template.id) {
      throw new Error("Cannot update a template using a different template ID");
    }

    if (previous === next) return;

    const templateRow = templateToRow(next.template);

    const templateChanged = !haveSamePersistedRowValues(
      templateToRow(previous.template),
      templateRow,
    );

    const exercises = diffRowsById(
      previous.exercises.map(({ templateExercise }) =>
        templateExerciseToRow(templateExercise),
      ),
      next.exercises.map(({ templateExercise }) =>
        templateExerciseToRow(templateExercise),
      ),
    );

    const sets = diffRowsById(
      previous.exercises.flatMap(({ sets }) => sets.map(templateSetToRow)),
      next.exercises.flatMap(({ sets }) => sets.map(templateSetToRow)),
    );

    const hasTemplateExerciseChanges =
      exercises.inserted.length > 0 ||
      exercises.updated.length > 0 ||
      exercises.deleted.length > 0;

    const hasTemplateSetChanges =
      sets.inserted.length > 0 ||
      sets.updated.length > 0 ||
      sets.deleted.length > 0;

    if (
      !templateChanged &&
      !hasTemplateExerciseChanges &&
      !hasTemplateSetChanges
    ) {
      return;
    }

    const deletedExerciseIds = exercises.deleted.map(({ id }) => id);
    const deletedSetIds = sets.deleted
      .filter(
        ({ templateExerciseId }) =>
          !deletedExerciseIds.includes(templateExerciseId),
      )
      .map(({ id }) => id);

    db.transaction((tx) => {
      if (
        !tx
          .select({ id: templatesTable.id })
          .from(templatesTable)
          .where(eq(templatesTable.id, next.template.id))
          .get()
      ) {
        throw new Error("Template not found");
      }

      if (templateChanged) {
        const { id, ...values } = templateRow;

        tx.update(templatesTable)
          .set(values)
          .where(eq(templatesTable.id, id))
          .run();
      }

      if (exercises.inserted.length > 0) {
        tx.insert(templateExercisesTable).values(exercises.inserted).run();
      }

      if (sets.inserted.length > 0) {
        tx.insert(templateSetsTable).values(sets.inserted).run();
      }

      for (const { id, ...values } of exercises.updated) {
        tx.update(templateExercisesTable)
          .set(values)
          .where(eq(templateExercisesTable.id, id))
          .run();
      }

      for (const { id, ...values } of sets.updated) {
        tx.update(templateSetsTable)
          .set(values)
          .where(eq(templateSetsTable.id, id))
          .run();
      }

      if (deletedSetIds.length > 0) {
        tx.delete(templateSetsTable)
          .where(inArray(templateSetsTable.id, deletedSetIds))
          .run();
      }

      if (deletedExerciseIds.length > 0) {
        tx.delete(templateExercisesTable)
          .where(inArray(templateExercisesTable.id, deletedExerciseIds))
          .run();
      }
    });
  };

export const deleteTemplateAggregate: TemplateRepository["deleteTemplateAggregate"] =
  async (id) => {
    db.delete(templatesTable).where(eq(templatesTable.id, id)).run();
  };

export const templateRepository: TemplateRepository = {
  getTemplateList,
  getTemplates,
  getTemplateAggregateById,
  insertTemplateAggregate,
  updateTemplateAggregate,
  deleteTemplateAggregate,
};
