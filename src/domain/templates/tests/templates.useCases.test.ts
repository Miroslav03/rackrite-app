import { assertTemplateCanBeSaved } from "../assertions/templates.contracts";
import { assertTemplateAggregateInvariants } from "../assertions/templates.invariants";
import {
  addTemplateExercise,
  addTemplateSet,
  createEmptyTemplate,
  removeTemplateExercise,
  removeTemplateSet,
  updateTemplateExercise,
  updateTemplateExerciseOrder,
  updateTemplateMetadata,
  updateTemplateSet,
} from "../templates.useCases";

import {
  barbellRow,
  competitionBench,
  exerciseId,
  now,
  pausedBench,
  setId,
} from "./templates.test.constants";
import { createTemplate, freezeTemplate } from "./templates.test.helpers";

describe("createEmptyTemplate", () => {
  it("creates a deterministic empty draft that cannot be saved", () => {
    const draft = createEmptyTemplate({ id: "draft", now });

    expect(draft).toEqual({
      template: {
        id: "draft",
        name: "",
        description: null,
        createdAt: now,
        updatedAt: now,
      },
      exercises: [],
    });

    expect(() => assertTemplateAggregateInvariants(draft)).not.toThrow();
    expect(() => assertTemplateCanBeSaved(draft)).toThrow("name");
  });
});

describe("updateTemplateMetadata", () => {
  it("trims metadata and preserves identity and creation time", () => {
    const source = freezeTemplate(createTemplate());
    const next = updateTemplateMetadata(source, {
      name: "  Heavy bench  ",
      description: "  Pause each rep  ",
      now,
    });
    expect(next.template).toEqual({
      ...source.template,
      name: "Heavy bench",
      description: "Pause each rep",
      updatedAt: now,
    });
    expect(next.exercises).toBe(source.exercises);
  });

  it.each([null, "", "  \n  "])(
    "clears a description with %s",
    (description) => {
      const source = createTemplate();
      source.template.description = "Existing";
      expect(
        updateTemplateMetadata(freezeTemplate(source), { description, now })
          .template.description,
      ).toBeNull();
    },
  );

  it("allows clearing the draft name but blocks saving it", () => {
    const next = updateTemplateMetadata(freezeTemplate(createTemplate()), {
      name: "  ",
      now,
    });

    expect(next.template.name).toBe("");
    expect(() => assertTemplateCanBeSaved(next)).toThrow("name");
  });

  it("preserves omitted metadata and allows duplicate names", () => {
    const source = freezeTemplate(createTemplate());

    expect(
      updateTemplateMetadata(source, { description: "Note", now }).template
        .name,
    ).toBe(source.template.name);
    expect(() =>
      assertTemplateCanBeSaved(createTemplate("other")),
    ).not.toThrow();
  });
});

describe("addTemplateExercise", () => {
  const input = {
    templateExerciseId: "new_exercise",
    setId: "new_set",
    exercise: pausedBench,
    reps: 3,
    restSeconds: 120,
    now,
  };

  it("appends an exercise with one working set and explicit reps/rest", () => {
    const source = freezeTemplate(createTemplate());
    const next = addTemplateExercise(source, input);

    expect(next.exercises[2]).toEqual({
      exercise: pausedBench,
      templateExercise: {
        id: "new_exercise",
        templateId: source.template.id,
        exerciseId: pausedBench.id,
        notes: null,
        restSeconds: 120,
        orderIndex: 2,
        createdAt: now,
        updatedAt: now,
      },
      sets: [
        {
          id: "new_set",
          templateExerciseId: "new_exercise",
          setIndex: 0,
          type: "working",
          reps: 3,
          rpe: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    expect(next.template.updatedAt).toBe(now);
    expect(next.exercises[0]).toBe(source.exercises[0]);
  });

  it("accepts an explicit initial set type and RPE", () => {
    const next = addTemplateExercise(freezeTemplate(createTemplate()), {
      ...input,
      type: "top",
      rpe: 8,
    });

    expect(next.exercises[2].sets[0]).toMatchObject({
      type: "top",
      reps: 3,
      rpe: 8,
    });
  });

  it("allows more than three exercises, repeated variations and accessories", () => {
    let next = createTemplate();

    for (const [index, exercise] of [
      pausedBench,
      pausedBench,
      barbellRow,
    ].entries()) {
      next = addTemplateExercise(freezeTemplate(next), {
        ...input,
        exercise,
        templateExerciseId: `extra_${index}`,
        setId: `extra_set_${index}`,
      });
    }

    expect(next.exercises).toHaveLength(5);
    expect(() => assertTemplateCanBeSaved(next)).not.toThrow();
  });

  it("rejects a duplicate competition family", () => {
    expect(() =>
      addTemplateExercise(freezeTemplate(createTemplate()), {
        ...input,
        exercise: competitionBench,
      }),
    ).toThrow("competition lift");
  });

  it.each([
    [{ templateExerciseId: exerciseId }, "unique"],
    [{ setId }, "unique"],
    [{ reps: 0 }, "Reps"],
    [{ reps: 1.5 }, "Reps"],
    [{ restSeconds: 0 }, "rest duration"],
    [{ restSeconds: Infinity }, "rest duration"],
    [{ rpe: 7.5 }, "RPE"],
  ] as const)("rejects invalid insertion: %o", (patch, error) => {
    expect(() =>
      addTemplateExercise(freezeTemplate(createTemplate()), {
        ...input,
        ...patch,
      }),
    ).toThrow(error);
  });
});

describe("updateTemplateExercise", () => {
  it("patches selection, notes and rest while retaining existing sets", () => {
    const source = freezeTemplate(createTemplate());
    const next = updateTemplateExercise(source, {
      templateExerciseId: exerciseId,
      exercise: pausedBench,
      notes: "  Pause  ",
      restSeconds: 240,
      now,
    });

    expect(next.exercises[0].templateExercise).toEqual({
      ...source.exercises[0].templateExercise,
      exerciseId: pausedBench.id,
      notes: "Pause",
      restSeconds: 240,
      updatedAt: now,
    });
    expect(next.exercises[0].exercise).toEqual(pausedBench);
    expect(next.exercises[0].sets).toBe(source.exercises[0].sets);
    expect(next.exercises[1]).toBe(source.exercises[1]);
    expect(next.template.updatedAt).toBe(now);
  });

  it.each([null, "", "   "])(
    "clears notes with %s and preserves other fields",
    (notes) => {
      const source = createTemplate();
      source.exercises[0].templateExercise.notes = "Old note";
      const next = updateTemplateExercise(freezeTemplate(source), {
        templateExerciseId: exerciseId,
        notes,
        now,
      });

      expect(next.exercises[0].templateExercise).toEqual({
        ...source.exercises[0].templateExercise,
        notes: null,
        updatedAt: now,
      });
      expect(next.exercises[0].exercise).toBe(source.exercises[0].exercise);
    },
  );

  it("preserves rest and notes when changing only the exercise definition", () => {
    const source = createTemplate();
    source.exercises[0].templateExercise.notes = "Keep";
    const next = updateTemplateExercise(freezeTemplate(source), {
      templateExerciseId: exerciseId,
      exercise: pausedBench,
      now,
    });

    expect(next.exercises[0].templateExercise).toMatchObject({
      notes: "Keep",
      restSeconds: 180,
    });
  });

  it("rejects replacing an accessory with an already selected competition family", () => {
    const source = freezeTemplate(createTemplate());

    expect(() =>
      updateTemplateExercise(source, {
        templateExerciseId: source.exercises[1].templateExercise.id,
        exercise: competitionBench,
        now,
      }),
    ).toThrow("competition lift");
  });

  it.each([0, -1, 1.5, NaN, Infinity])(
    "rejects invalid rest %s",
    (restSeconds) => {
      expect(() =>
        updateTemplateExercise(freezeTemplate(createTemplate()), {
          templateExerciseId: exerciseId,
          restSeconds,
          now,
        }),
      ).toThrow("rest duration");
    },
  );
});

describe("removeTemplateExercise", () => {
  it("removes children and reindexes remaining exercises with updated timestamps", () => {
    const source = freezeTemplate(createTemplate());
    const next = removeTemplateExercise(source, {
      templateExerciseId: exerciseId,
      now,
    });

    expect(next.exercises).toHaveLength(1);
    expect(next.exercises[0].templateExercise).toEqual({
      ...source.exercises[1].templateExercise,
      orderIndex: 0,
      updatedAt: now,
    });
    expect(next.exercises[0].sets).toBe(source.exercises[1].sets);
    expect(next.template.updatedAt).toBe(now);
  });

  it("allows removing the final exercise but blocks saving the empty draft", () => {
    const next = removeTemplateExercise(
      freezeTemplate(createTemplate("template_1", [competitionBench])),
      { templateExerciseId: exerciseId, now },
    );

    expect(next.exercises).toEqual([]);
    expect(() => assertTemplateCanBeSaved(next)).toThrow(
      "at least one exercise",
    );
  });
});

describe("updateTemplateExerciseOrder", () => {
  it.each([
    [0, 2],
    [2, 0],
  ])("moves an exercise from %s to %s", (from, to) => {
    const source = freezeTemplate(
      createTemplate("template_1", [competitionBench, pausedBench, barbellRow]),
    );
    const moving = source.exercises[from];
    const next = updateTemplateExerciseOrder(source, {
      templateExerciseId: moving.templateExercise.id,
      orderIndex: to,
      now,
    });

    expect(next.exercises[to].templateExercise.id).toBe(
      moving.templateExercise.id,
    );
    expect(
      next.exercises.map(({ templateExercise }) => templateExercise.orderIndex),
    ).toEqual([0, 1, 2]);
    expect(
      next.exercises.every(
        ({ templateExercise }) => templateExercise.updatedAt === now,
      ),
    ).toBe(true);
    expect(next.exercises[to].sets).toBe(moving.sets);
    expect(next.template.updatedAt).toBe(now);
    expect(() => assertTemplateCanBeSaved(next)).not.toThrow();
  });

  it("returns the same aggregate for an unchanged position", () => {
    const source = freezeTemplate(createTemplate());

    expect(
      updateTemplateExerciseOrder(source, {
        templateExerciseId: exerciseId,
        orderIndex: 0,
        now,
      }),
    ).toBe(source);
  });

  it.each([-1, 2, 0.5, NaN, Infinity])(
    "rejects invalid position %s",
    (orderIndex) => {
      expect(() =>
        updateTemplateExerciseOrder(freezeTemplate(createTemplate()), {
          templateExerciseId: exerciseId,
          orderIndex,
          now,
        }),
      ).toThrow("index");
    },
  );
});

describe("addTemplateSet", () => {
  it("appends an independently identified set with explicit reps and default type/RPE", () => {
    const source = freezeTemplate(createTemplate());
    const next = addTemplateSet(source, {
      templateExerciseId: exerciseId,
      setId: "new_set",
      reps: 3,
      now,
    });

    expect(next.exercises[0].sets[2]).toEqual({
      id: "new_set",
      templateExerciseId: exerciseId,
      setIndex: 2,
      type: "working",
      reps: 3,
      rpe: null,
      createdAt: now,
      updatedAt: now,
    });
    expect(next.exercises[0].templateExercise.updatedAt).toBe(now);
    expect(next.exercises[0].sets[0]).toBe(source.exercises[0].sets[0]);
    expect(next.exercises[1]).toBe(source.exercises[1]);
    expect(next.template.updatedAt).toBe(now);
  });

  it("accepts an explicit type and RPE", () => {
    const next = addTemplateSet(freezeTemplate(createTemplate()), {
      templateExerciseId: exerciseId,
      setId: "new_set",
      reps: 1,
      type: "top",
      rpe: 9,
      now,
    });

    expect(next.exercises[0].sets[2]).toMatchObject({
      type: "top",
      reps: 1,
      rpe: 9,
    });
  });

  it.each([
    [{ setId }, "unique"],
    [{ reps: 0 }, "Reps"],
    [{ reps: NaN }, "Reps"],
    [{ rpe: 11 }, "RPE"],
  ] as const)("rejects invalid insertion %o", (patch, error) => {
    expect(() =>
      addTemplateSet(freezeTemplate(createTemplate()), {
        templateExerciseId: exerciseId,
        setId: "new_set",
        reps: 5,
        now,
        ...patch,
      }),
    ).toThrow(error);
  });
});

describe("updateTemplateSet", () => {
  it("patches values while preserving identity, order, ownership, and creation time", () => {
    const source = freezeTemplate(createTemplate());
    const next = updateTemplateSet(source, {
      setId,
      type: "top",
      reps: 3,
      rpe: 8,
      now,
    });

    expect(next.exercises[0].sets[0]).toEqual({
      ...source.exercises[0].sets[0],
      type: "top",
      reps: 3,
      rpe: 8,
      updatedAt: now,
    });
    expect(next.exercises[0].sets[1]).toBe(source.exercises[0].sets[1]);
    expect(next.exercises[0].templateExercise.updatedAt).toBe(now);
    expect(next.exercises[1]).toBe(source.exercises[1]);
    expect(next.template.updatedAt).toBe(now);
  });

  it("preserves omitted values and explicitly clears RPE", () => {
    const source = createTemplate();
    source.exercises[0].sets[0].rpe = 8;
    const next = updateTemplateSet(freezeTemplate(source), {
      setId,
      reps: 4,
      now,
    });
    expect(next.exercises[0].sets[0]).toMatchObject({
      type: "working",
      reps: 4,
      rpe: 8,
    });
    expect(
      updateTemplateSet(freezeTemplate(next), { setId, rpe: null, now: 3000 })
        .exercises[0].sets[0],
    ).toMatchObject({ reps: 4, rpe: null });
  });

  it.each([
    { reps: 0 },
    { reps: -1 },
    { reps: 1.5 },
    { reps: NaN },
    { reps: Infinity },
    { rpe: 0 },
    { rpe: 7.5 },
    { rpe: 11 },
    { rpe: NaN },
  ])("rejects invalid values %o", (patch) => {
    expect(() =>
      updateTemplateSet(freezeTemplate(createTemplate()), {
        setId,
        now,
        ...patch,
      }),
    ).toThrow("reps" in patch ? "Reps" : "RPE");
  });
});

describe("removeTemplateSet", () => {
  it("removes a set and reindexes its following siblings", () => {
    const source = freezeTemplate(createTemplate());
    const next = removeTemplateSet(source, { setId, now });

    expect(next.exercises[0].sets).toEqual([
      { ...source.exercises[0].sets[1], setIndex: 0, updatedAt: now },
    ]);
    expect(next.exercises[0].templateExercise.updatedAt).toBe(now);
    expect(next.exercises[1]).toBe(source.exercises[1]);
    expect(next.template.updatedAt).toBe(now);
  });

  it("removes the exercise when its final set is removed", () => {
    const source = createTemplate();

    source.exercises[0].sets = [source.exercises[0].sets[0]];

    const next = removeTemplateSet(freezeTemplate(source), { setId, now });

    expect(next.exercises).toHaveLength(1);
    expect(next.exercises[0].templateExercise).toEqual({
      ...source.exercises[1].templateExercise,
      orderIndex: 0,
      updatedAt: now,
    });
  });

  it("allows an empty draft after its final set is removed", () => {
    const source = createTemplate("template_1", [competitionBench]);

    source.exercises[0].sets = [source.exercises[0].sets[0]];

    const next = removeTemplateSet(freezeTemplate(source), { setId, now });

    expect(next.exercises).toEqual([]);
    expect(() => assertTemplateCanBeSaved(next)).toThrow(
      "at least one exercise",
    );
  });
});
