import { progressConfig } from "../../progress.config";
import { deriveLiftSessions } from "../../sessions/progress.sessions";
import {
  atDay,
  exposure,
  type FixtureSet,
} from "../../tests/progress.test.helpers";
import { deriveWorkoutRepObservations } from "../progress.repObservations";

function sessionWithSets(sets: FixtureSet[]) {
  return deriveLiftSessions([exposure(0, { sets })], "bench", atDay(1))[0];
}

it("returns no observations for an empty strength-set collection", () => {
  expect(deriveWorkoutRepObservations([])).toEqual([]);
});

it("returns one observation for one eligible rep count", () => {
  const { strengthSets } = sessionWithSets([{ weight: 100, reps: 5, rpe: 8 }]);

  expect(deriveWorkoutRepObservations(strengthSets)).toEqual([
    {
      reps: 5,
      rawRepresentative: strengthSets[0],
      adjustedRepresentative: strengthSets[0],
      eligibleSetCount: 1,
      adjustedEligibleSetCount: 1,
    },
  ]);
});

it("groups exact reps separately and returns them in ascending order", () => {
  const { strengthSets } = sessionWithSets([
    { weight: 90, reps: 8, rpe: 8 },
    { weight: 100, reps: 5, rpe: 9 },
    { weight: 120, reps: 2, rpe: 8 },
    { weight: 100, reps: 5, rpe: 7 },
    { weight: 100, reps: 5, rpe: 8 },
  ]);
  const observations = deriveWorkoutRepObservations(strengthSets);

  expect(observations.map((observation) => observation.reps)).toEqual([
    2, 5, 8,
  ]);
  expect(
    observations.map((observation) => observation.eligibleSetCount),
  ).toEqual([1, 3, 1]);
  expect(
    observations.map((observation) => observation.adjustedEligibleSetCount),
  ).toEqual([1, 3, 1]);
  expect(observations[1].rawRepresentative).toBe(strengthSets[3]);
  expect(observations[1].adjustedRepresentative).toBe(strengthSets[3]);
});

it("selects the highest load and highest adjusted estimate independently", () => {
  const { strengthSets } = sessionWithSets([
    { weight: 105, reps: 5, rpe: 9 },
    { weight: 102.5, reps: 5, rpe: 7 },
  ]);
  const [observation] = deriveWorkoutRepObservations(strengthSets);

  expect(observation.rawRepresentative).toBe(strengthSets[0]);
  expect(observation.adjustedRepresentative).toBe(strengthSets[1]);
  expect(observation).toMatchObject({
    eligibleSetCount: 2,
    adjustedEligibleSetCount: 2,
  });
});

it("preserves raw eligibility without inventing missing RPE", () => {
  const { strengthSets } = sessionWithSets([
    { weight: 100, reps: 5, rpe: null },
    { weight: 105, reps: 5, rpe: null },
  ]);
  const [observation] = deriveWorkoutRepObservations(strengthSets);

  expect(observation.rawRepresentative).toBe(strengthSets[1]);
  expect(observation.rawRepresentative.rpe).toBeNull();
  expect(observation).toMatchObject({
    adjustedRepresentative: null,
    eligibleSetCount: 2,
    adjustedEligibleSetCount: 0,
  });
});

it("counts raw and adjusted eligibility separately when RPE is partial", () => {
  const { strengthSets } = sessionWithSets([
    { weight: 110, reps: 5, rpe: null },
    { weight: 105, reps: 5, rpe: 9 },
    { weight: 102.5, reps: 5, rpe: 7 },
  ]);
  const [observation] = deriveWorkoutRepObservations(strengthSets);

  expect(observation.rawRepresentative).toBe(strengthSets[0]);
  expect(observation.adjustedRepresentative).toBe(strengthSets[2]);
  expect(observation).toMatchObject({
    eligibleSetCount: 3,
    adjustedEligibleSetCount: 2,
  });
});

it.each([0, 11, 7.5, NaN, Infinity])(
  "uses the session's raw-only eligibility for malformed RPE %s",
  (rpe) => {
    const { strengthSets } = sessionWithSets([{ rpe }]);
    const [observation] = deriveWorkoutRepObservations(strengthSets);

    expect(observation.rawRepresentative).toBe(strengthSets[0]);
    expect(observation.rawRepresentative.rpe).toBeNull();
    expect(observation).toMatchObject({
      adjustedRepresentative: null,
      eligibleSetCount: 1,
      adjustedEligibleSetCount: 0,
    });
  },
);

it("excludes unsupported effective reps from adjusted selection only", () => {
  const { strengthSets } = sessionWithSets([
    { weight: 110, reps: 10, rpe: 7 },
    { weight: 100, reps: 10, rpe: 10 },
    { weight: 105, reps: 9, rpe: 7 },
  ]);
  const observations = deriveWorkoutRepObservations(strengthSets);

  expect(observations[0]).toEqual({
    reps: 9,
    rawRepresentative: strengthSets[2],
    adjustedRepresentative: null,
    eligibleSetCount: 1,
    adjustedEligibleSetCount: 0,
  });
  expect(observations[1]).toEqual({
    reps: 10,
    rawRepresentative: strengthSets[0],
    adjustedRepresentative: strengthSets[1],
    eligibleSetCount: 2,
    adjustedEligibleSetCount: 1,
  });
});

it.each([NaN, Infinity, -Infinity, 0, -1])(
  "does not count or select an invalid adjusted estimate %s",
  (adjustedEstimate) => {
    const { strengthSets } = sessionWithSets([
      { weight: 105 },
      { weight: 100 },
    ]);
    const sets = [{ ...strengthSets[0], adjustedEstimate }, strengthSets[1]];
    const [observation] = deriveWorkoutRepObservations(sets);

    expect(observation.rawRepresentative).toBe(sets[0]);
    expect(observation.adjustedRepresentative).toBe(sets[1]);
    expect(observation.adjustedEligibleSetCount).toBe(1);
  },
);

it("handles every supported exact rep count from 1 through 10", () => {
  const reps = Array.from({ length: 10 }, (_, index) => index + 1);
  const { strengthSets } = sessionWithSets(
    [...reps].reverse().map((reps) => ({ reps, rpe: 10 })),
  );
  const observations = deriveWorkoutRepObservations(strengthSets);

  expect(observations.map((observation) => observation.reps)).toEqual(reps);
  for (const observation of observations) {
    expect(observation.rawRepresentative.reps).toBe(observation.reps);
    expect(observation.adjustedRepresentative).toBe(
      observation.rawRepresentative,
    );
    expect(observation.eligibleSetCount).toBe(1);
    expect(observation.adjustedEligibleSetCount).toBe(1);
  }
});

it("keeps observations within 1–10 reps when extraction uses a wider formula range", () => {
  const [session] = deriveLiftSessions(
    [exposure(0, { sets: [{ reps: 1 }, { reps: 10, rpe: 10 }, { reps: 11 }] })],
    "bench",
    atDay(1),
    { ...progressConfig, maxEstimateReps: 12 },
  );

  expect(session.strengthSets).toHaveLength(3);
  expect(
    deriveWorkoutRepObservations(session.strengthSets).map(
      (observation) => observation.reps,
    ),
  ).toEqual([1, 10]);
});

it("breaks raw load ties by lower known RPE regardless of input order", () => {
  const { strengthSets } = sessionWithSets([
    { rpe: null },
    { rpe: 9 },
    { rpe: 7 },
  ]);

  for (const sets of [strengthSets, [...strengthSets].reverse()]) {
    const [observation] = deriveWorkoutRepObservations(sets);
    expect(observation.rawRepresentative).toBe(strengthSets[2]);
    expect(observation.adjustedRepresentative).toBe(strengthSets[2]);
  }
});

it("uses stored adjusted scores and breaks score ties by higher load", () => {
  const { strengthSets } = sessionWithSets([
    { weight: 105, rpe: 9 },
    { weight: 102.5, rpe: 7 },
  ]);
  const tiedSets = strengthSets.map((set) => ({
    ...set,
    adjustedEstimate: 150,
  }));

  for (const sets of [tiedSets, [...tiedSets].reverse()]) {
    expect(deriveWorkoutRepObservations(sets)[0].adjustedRepresentative).toBe(
      tiedSets[0],
    );
  }
});

it("breaks equal performance ties by later set completion", () => {
  const { strengthSets } = sessionWithSets([{}, {}]);

  for (const sets of [strengthSets, [...strengthSets].reverse()]) {
    const [observation] = deriveWorkoutRepObservations(sets);
    expect(observation.rawRepresentative).toBe(strengthSets[1]);
    expect(observation.adjustedRepresentative).toBe(strengthSets[1]);
  }
});

it("breaks equal performance and timestamp ties by stable set identity", () => {
  const { strengthSets } = sessionWithSets([{}, {}]);
  const tiedSets = strengthSets.map((set) => ({
    ...set,
    finishedAt: strengthSets[0].finishedAt,
  }));

  for (const sets of [tiedSets, [...tiedSets].reverse()]) {
    const [observation] = deriveWorkoutRepObservations(sets);
    expect(observation.rawRepresentative).toBe(tiedSets[0]);
    expect(observation.adjustedRepresentative).toBe(tiedSets[0]);
  }
});

it("preserves semantic observations across input permutations", () => {
  const { strengthSets } = sessionWithSets([
    { weight: 90, reps: 8, rpe: 8 },
    { weight: 105, reps: 5, rpe: 9 },
    { weight: 120, reps: 2, rpe: 8 },
    { weight: 102.5, reps: 5, rpe: 7 },
    { weight: 100, reps: 5, rpe: null },
  ]);
  const expected = deriveWorkoutRepObservations(strengthSets);
  const permutations = [
    [...strengthSets].reverse(),
    ...strengthSets.map((_, index) => [
      ...strengthSets.slice(index),
      ...strengthSets.slice(0, index),
    ]),
  ];

  for (const sets of permutations) {
    expect(deriveWorkoutRepObservations(sets)).toEqual(expected);
  }
});

it("retains original set references and source identities without mutating input", () => {
  const { strengthSets } = sessionWithSets([
    { weight: 105, reps: 5, rpe: 9 },
    { weight: 102.5, reps: 5, rpe: 7 },
  ]);
  const original = strengthSets.map((set) => ({ ...set }));
  const frozenSets = Object.freeze(
    strengthSets.map((set) => Object.freeze(set)),
  );
  const [observation] = deriveWorkoutRepObservations(frozenSets);

  expect(frozenSets).toEqual(original);
  expect(observation.rawRepresentative).toBe(strengthSets[0]);
  expect(observation.adjustedRepresentative).toBe(strengthSets[1]);
  expect(observation.rawRepresentative).toMatchObject({
    workoutId: "workout_0",
    workoutExerciseId: "entry_workout_0",
    setId: "set_workout_0_0",
  });
  expect(observation.adjustedRepresentative).toMatchObject({
    workoutId: "workout_0",
    workoutExerciseId: "entry_workout_0",
    setId: "set_workout_0_1",
  });
});

it("does not apply the legacy workout-wide floor to higher-rep observations", () => {
  const session = sessionWithSets([
    { weight: 140, reps: 2, rpe: 10 },
    { weight: 100, reps: 8, rpe: 8 },
  ]);
  const observations = deriveWorkoutRepObservations(session.strengthSets);

  expect(session.rawRepresentative).toBe(session.strengthSets[0]);
  expect(session.adjustedRepresentative).toBe(session.strengthSets[0]);
  expect(session.strengthSets[1].rawEstimate).toBeLessThan(
    session.strengthSets[0].rawEstimate *
      progressConfig.adjustedRepresentativeFloor,
  );
  expect(observations[1].adjustedRepresentative).toBe(session.strengthSets[1]);
  expect(observations[1].adjustedEligibleSetCount).toBe(1);
});

it("selects a stronger adjusted set below the legacy floor within the same rep group", () => {
  const session = sessionWithSets([
    { weight: 94, rpe: 7 },
    { weight: 100, rpe: 9 },
  ]);
  const [observation] = deriveWorkoutRepObservations(session.strengthSets);

  expect(session.adjustedRepresentative).toBe(session.strengthSets[1]);
  expect(observation.rawRepresentative).toBe(session.strengthSets[1]);
  expect(observation.adjustedRepresentative).toBe(session.strengthSets[0]);
  expect(observation.adjustedEligibleSetCount).toBe(2);
});

it("reuses session exclusions for invalid, incomplete, warmup and deliberately easy sets", () => {
  const session = sessionWithSets([
    { weight: 200, type: "warmup" },
    { weight: NaN },
    { weight: 0 },
    { reps: 0 },
    { finished: false },
    { rpe: 6 },
    { reps: 11 },
    { weight: 90, reps: 8, rpe: null },
    { weight: 100, reps: 2, rpe: 8 },
  ]);

  expect(session.strengthSets.map((set) => set.setId)).toEqual([
    "set_workout_0_7",
    "set_workout_0_8",
  ]);
  expect(deriveWorkoutRepObservations(session.strengthSets)).toEqual([
    {
      reps: 2,
      rawRepresentative: session.strengthSets[1],
      adjustedRepresentative: session.strengthSets[1],
      eligibleSetCount: 1,
      adjustedEligibleSetCount: 1,
    },
    {
      reps: 8,
      rawRepresentative: session.strengthSets[0],
      adjustedRepresentative: null,
      eligibleSetCount: 1,
      adjustedEligibleSetCount: 0,
    },
  ]);
});
