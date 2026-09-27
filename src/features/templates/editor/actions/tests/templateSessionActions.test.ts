import {
  barbellRow,
  competitionBench,
} from "@/domain/templates/editor/tests/templates.test.constants";
import {
  createTemplate,
  freezeTemplate,
} from "@/domain/templates/editor/tests/templates.test.helpers";
import { createTemplateSessionActions } from "../templateSessionActions";

jest.mock("@/data/repositories/templateRepository", () => ({
  templateRepository: { insertTemplateAggregate: jest.fn() },
}));

const actions = createTemplateSessionActions({
  repository: { insertTemplateAggregate: jest.fn() },
  now: () => 2000,
  createTemplateId: () => "template",
  createTemplateExerciseId: () => "exercise",
  createTemplateSetId: () => "set",
});

it("adds a fresh set with stable ownership and preserves previous values", () => {
  const original = freezeTemplate(createTemplate());
  const exercise = original.exercises[0];
  const next = actions.addSet(original, {
    templateExerciseId: exercise.templateExercise.id,
  });

  expect(next.exercises[0].sets).toEqual([
    ...exercise.sets,
    {
      id: "set",
      templateExerciseId: exercise.templateExercise.id,
      setIndex: exercise.sets.length,
      type: "working",
      reps: 5,
      rpe: null,
      createdAt: 2000,
      updatedAt: 2000,
    },
  ]);
  expect(original.exercises[0].sets).toHaveLength(exercise.sets.length);
});

it("reorders and removes exercises immutably, reindexing the remaining entries", () => {
  const original = freezeTemplate(
    createTemplate("template", [competitionBench, barbellRow]),
  );
  const [first, second] = original.exercises;
  const reordered = actions.updateExerciseOrder(original, {
    templateExerciseId: second.templateExercise.id,
    orderIndex: 0,
  });

  expect(
    reordered.exercises.map(({ templateExercise }) => templateExercise.id),
  ).toEqual([second.templateExercise.id, first.templateExercise.id]);
  expect(
    reordered.exercises.map(
      ({ templateExercise }) => templateExercise.orderIndex,
    ),
  ).toEqual([0, 1]);
  expect(original.exercises[0]).toBe(first);
  expect(
    actions.updateExerciseOrder(reordered, {
      templateExerciseId: second.templateExercise.id,
      orderIndex: 0,
    }),
  ).toBe(reordered);

  const removed = actions.removeExercise(reordered, {
    templateExerciseId: second.templateExercise.id,
  });
  expect(removed.exercises).toHaveLength(1);
  expect(removed.exercises[0].templateExercise).toMatchObject({
    id: first.templateExercise.id,
    orderIndex: 0,
  });
  expect(removed.exercises[0].sets).toEqual(first.sets);
});

it("adds an exercise with one working set, five reps, null RPE and its rest default", () => {
  const original = freezeTemplate(actions.createEmptyTemplate());
  const next = actions.addExercise(original, { exercise: competitionBench });
  expect(original.exercises).toEqual([]);
  expect(next.exercises[0].templateExercise).toMatchObject({
    id: "exercise",
    restSeconds: 180,
  });
  expect(next.exercises[0].sets).toEqual([
    expect.objectContaining({ id: "set", type: "working", reps: 5, rpe: null }),
  ]);
});

it("falls back to the exercise-kind rest default", () => {
  const next = actions.addExercise(actions.createEmptyTemplate(), {
    exercise: {
      ...barbellRow,
      kind: "accessory",
      liftFamily: null,
      defaultRestSeconds: null,
    },
  });
  expect(next.exercises[0].templateExercise.restSeconds).toBe(90);
});

it("updates values immutably and removes an exercise with its final set", () => {
  const original = freezeTemplate(
    actions.addExercise(actions.createEmptyTemplate(), {
      exercise: barbellRow,
    }),
  );
  const next = actions.updateSet(original, {
    templateSetId: "set",
    values: { type: "top", reps: 3, rpe: 8 },
  });
  expect(next.exercises[0].sets[0]).toMatchObject({
    type: "top",
    reps: 3,
    rpe: 8,
  });
  expect(original.exercises[0].sets[0]).toMatchObject({
    type: "working",
    reps: 5,
    rpe: null,
  });
  expect(actions.removeSet(next, { templateSetId: "set" }).exercises).toEqual(
    [],
  );
});

it("rejects invalid reps and unknown sets without mutating the draft", () => {
  const template = freezeTemplate(createTemplate());
  const templateSetId = template.exercises[0].sets[0].id;
  expect(() =>
    actions.updateSet(template, { templateSetId, values: { reps: 0 } }),
  ).toThrow("Reps");
  expect(() =>
    actions.removeSet(template, { templateSetId: "missing" }),
  ).toThrow("not found");
});
