import { deriveLiftSessions } from "../progress.sessions";
import { exposure, atDay } from "../../tests/progress.test.helpers";

it("analyzes working/backoff sets without making top sets special", () => {
  const sessions = deriveLiftSessions(
    [
      exposure(0, {
        sets: [
          { weight: 20, type: "warmup" },
          { weight: 100, type: "working" },
          { weight: 90, type: "top" },
          { weight: 105, type: "backoff" },
        ],
      }),
    ],
    "bench",
    atDay(1),
  );

  expect(sessions[0]).toMatchObject({
    volume: 1475,
    validSetCount: 3,
    rawRepresentative: { weight: 105 },
  });
});

it("excludes active workouts and variations", () => {
  expect(
    deriveLiftSessions(
      [exposure(0, { active: true }), exposure(1, { variation: true })],
      "bench",
      atDay(2),
    ),
  ).toEqual([]);
});

it.each([
  { weight: null },
  { reps: null },
  { weight: 0 },
  { weight: -1 },
  { weight: NaN },
  { weight: Infinity },
  { reps: 0 },
  { reps: 1.5 },
  { finished: false },
])("safely excludes invalid or incomplete training %o", (set) => {
  expect(
    deriveLiftSessions([exposure(0, { sets: [set] })], "bench", atDay(1))[0],
  ).toMatchObject({ volume: 0, validSetCount: 0, rawRepresentative: null });
});

it("keeps high repetitions and low recorded effort in volume only", () => {
  const session = deriveLiftSessions(
    [exposure(0, { sets: [{ reps: 12 }, { rpe: 6 }] })],
    "bench",
    atDay(1),
  )[0];

  expect(session.volume).toBe(1700);
  expect(session.rawRepresentative).toBeNull();
});

it("does not lose valid strength when RPE is malformed or absent", () => {
  const session = deriveLiftSessions(
    [exposure(0, { sets: [{ rpe: 7.5 }, { rpe: null }] })],
    "bench",
    atDay(1),
  )[0];

  expect(session.rawRepresentative?.rawEstimate).toBe(112.5);
  expect(session.typicalRpe).toBeNull();
  expect(session.rpeSetCount).toBe(0);
});

it("deduplicates repeated records without mutating history", () => {
  const item = exposure(0),
    original = JSON.stringify(item);
  const result = deriveLiftSessions([item, item], "bench", atDay(1));

  expect(result).toHaveLength(1);
  expect(result[0].volume).toBe(500);
  expect(JSON.stringify(item)).toBe(original);
});

it("quarantines conflicting set identities", () => {
  const item = exposure(0);
  const duplicate = {
    ...item,
    entries: item.entries.map((entry) => ({
      ...entry,
      sets: entry.sets.map((set) => ({ ...set, weight: 200 })),
    })),
  };

  expect(
    deriveLiftSessions([item, duplicate], "bench", atDay(1))[0],
  ).toMatchObject({ volume: 0, issues: ["conflicting_duplicate"] });
});

it("withholds ambiguous competition definitions", () => {
  const item = exposure(0),
    other = {
      ...exposure(1),
      exercise: { ...item.exercise, id: "other_bench" },
    };

  expect(
    deriveLiftSessions([item, other], "bench", atDay(2)).every(
      (session) =>
        session.rawRepresentative === null &&
        session.issues.includes("ambiguous_identity"),
    ),
  ).toBe(true);
});

it("selects adjusted performance from the eligible heavy pool before ranking", () => {
  const session = deriveLiftSessions(
    [
      exposure(0, {
        sets: [
          { weight: 94, rpe: 7 },
          { weight: 100, rpe: 9 },
        ],
      }),
    ],
    "bench",
    atDay(1),
  )[0];

  expect(session.adjustedRepresentative).toMatchObject({ weight: 100, rpe: 9 });
});

it("does not let invalid or active alternate identities contaminate completed history", () => {
  const invalid = exposure(1, { active: true });

  invalid.exercise.id = "other_bench";
  expect(
    deriveLiftSessions([exposure(0), invalid], "bench", atDay(2))[0]
      .rawRepresentative,
  ).not.toBeNull();
});

it("excludes invalid ownership and set chronology", () => {
  const item = exposure(0, { sets: [{}, {}] });
  const sets = item.entries[0].sets.map((set, i) =>
    i === 0
      ? { ...set, workoutExerciseId: "wrong" }
      : { ...set, finishedAt: atDay(1) },
  );
  const result = deriveLiftSessions(
    [{ ...item, entries: [{ ...item.entries[0], sets }] }],
    "bench",
    atDay(2),
  )[0];

  expect(result).toMatchObject({
    validSetCount: 0,
    invalidSetCount: 2,
    issues: ["invalid_ownership", "invalid_set"],
  });
});

it("excludes conflicting global set identities across competition families", () => {
  const bench = exposure(0),
    squat = exposure(1, { family: "squat" });
  const repeatedId = {
    ...squat,
    entries: squat.entries.map((entry) => ({
      ...entry,
      sets: entry.sets.map((set) => ({
        ...set,
        id: bench.entries[0].sets[0].id,
      })),
    })),
  };

  for (const family of ["bench", "squat"] as const) {
    expect(
      deriveLiftSessions([bench, repeatedId], family, atDay(2))[0],
    ).toMatchObject({
      rawRepresentative: null,
      issues: ["conflicting_duplicate"],
    });
  }
});

it("breaks equal estimates by exercise order then set order then stable identities", () => {
  const item = exposure(0);
  const entry = item.entries[0];
  const first = {
    exercise: { ...entry.exercise, id: "z_entry" },
    sets: entry.sets.map((set) => ({
      ...set,
      id: "z_set",
      workoutExerciseId: "z_entry",
      setIndex: 0,
    })),
  };
  const second = {
    exercise: { ...entry.exercise, id: "a_entry" },
    sets: entry.sets.map((set) => ({
      ...set,
      id: "a_set",
      workoutExerciseId: "a_entry",
      setIndex: 1,
    })),
  };

  for (const entries of [
    [first, second],
    [second, first],
  ]) {
    expect(
      deriveLiftSessions([{ ...item, entries }], "bench", atDay(1))[0]
        .rawRepresentative?.setId,
    ).toBe("z_set");
  }
});
