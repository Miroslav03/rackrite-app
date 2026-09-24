import type {
  ExerciseRow,
  TemplateExerciseRow,
  TemplateRow,
  TemplateSetRow,
} from "@/data/db/schema";
import {
  rowsToTemplateAggregate,
  templateExerciseRowToTemplateExercise,
  templateExerciseToRow,
  templateRowToTemplate,
  templateSetRowToTemplateSet,
  templateSetToRow,
  templateToRow,
} from "@/data/mappers/templateMappers";

import {
  createTemplate,
  freezeTemplate,
} from "@/domain/templates/tests/templates.test.helpers";

function createRows() {
  const aggregate = createTemplate();
  const templateRow: TemplateRow = { ...aggregate.template };
  const templateExerciseRows: TemplateExerciseRow[] = aggregate.exercises.map(
    ({ templateExercise }) => ({ ...templateExercise }),
  );
  const exerciseRows: ExerciseRow[] = aggregate.exercises.map(
    ({ exercise }) => ({ ...exercise }),
  );
  const setRows: TemplateSetRow[] = aggregate.exercises.flatMap(({ sets }) =>
    sets.map((set) => ({ ...set })),
  );
  return { templateRow, templateExerciseRows, exerciseRows, setRows };
}

describe("template mappers", () => {
  it("maps every field explicitly in both directions, including nulls", () => {
    const aggregate = freezeTemplate(createTemplate());
    const rows = createRows();

    expect(templateToRow(aggregate.template)).toEqual(rows.templateRow);
    expect(templateRowToTemplate(rows.templateRow)).toEqual(aggregate.template);
    expect(
      templateExerciseToRow(aggregate.exercises[0].templateExercise),
    ).toEqual(rows.templateExerciseRows[0]);
    expect(
      templateExerciseRowToTemplateExercise(rows.templateExerciseRows[0]),
    ).toEqual(aggregate.exercises[0].templateExercise);
    expect(templateSetToRow(aggregate.exercises[0].sets[0])).toEqual(
      rows.setRows[0],
    );
    expect(templateSetRowToTemplateSet(rows.setRows[0])).toEqual(
      aggregate.exercises[0].sets[0],
    );
    expect(rowsToTemplateAggregate(rows)).toEqual(aggregate);
  });

  it("preserves non-null optional values", () => {
    const rows = createRows();

    rows.templateRow.description = "Heavy day";
    rows.templateExerciseRows[0].notes = "Pause";
    rows.setRows[0].rpe = 8;

    const aggregate = rowsToTemplateAggregate(rows);

    expect(templateToRow(aggregate.template)).toEqual(rows.templateRow);
    expect(
      templateExerciseToRow(aggregate.exercises[0].templateExercise),
    ).toEqual(rows.templateExerciseRows[0]);
    expect(templateSetToRow(aggregate.exercises[0].sets[0])).toEqual(
      rows.setRows[0],
    );
  });

  it("sorts unordered rows without mutating the inputs", () => {
    const rows = createRows();

    rows.templateExerciseRows.reverse();
    rows.setRows.reverse();

    rows.templateExerciseRows.forEach(Object.freeze);
    rows.setRows.forEach(Object.freeze);

    Object.freeze(rows.templateExerciseRows);
    Object.freeze(rows.setRows);

    expect(rowsToTemplateAggregate(rows)).toEqual(createTemplate());
  });

  it("rejects a missing exercise definition", () => {
    const rows = createRows();
    rows.exerciseRows = [];

    expect(() => rowsToTemplateAggregate(rows)).toThrow("definition not found");
  });

  it("rejects exercises belonging to another template", () => {
    const rows = createRows();
    rows.templateExerciseRows[0].templateId = "other";

    expect(() => rowsToTemplateAggregate(rows)).toThrow("belong");
  });

  it("rejects orphan set rows instead of silently dropping them", () => {
    const rows = createRows();
    rows.setRows[0].templateExerciseId = "missing";

    expect(() => rowsToTemplateAggregate(rows)).toThrow("belong");
  });

  it("rejects duplicate IDs and invalid positions", () => {
    const rows = createRows();
    rows.setRows[1].id = rows.setRows[0].id;

    expect(() => rowsToTemplateAggregate(rows)).toThrow("unique");

    const unordered = createRows();
    unordered.templateExerciseRows[0].orderIndex = 10;

    expect(() => rowsToTemplateAggregate(unordered)).toThrow("indexes");
  });

  it("rejects incomplete saved aggregates", () => {
    const rows = createRows();
    rows.templateRow.name = " ";

    expect(() => rowsToTemplateAggregate(rows)).toThrow("name");

    rows.templateRow.name = "Valid name";
    rows.setRows = [];

    expect(() => rowsToTemplateAggregate(rows)).toThrow("at least one set");
  });

  it("rejects invalid persisted set values", () => {
    const rows = createRows();
    rows.setRows[0].reps = 0;

    expect(() => rowsToTemplateAggregate(rows)).toThrow("Reps");

    rows.setRows[0].reps = 5;
    Object.assign(rows.setRows[0], { type: "unsupported" });

    expect(() => rowsToTemplateAggregate(rows)).toThrow("type");
  });
});
