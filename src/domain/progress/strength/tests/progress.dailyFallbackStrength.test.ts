import type { LiftFamily } from "@/domain/domain.types";
import {
  addLocalCalendarDays,
  localCalendarDay,
} from "@/shared/utils/localCalendar";

import {
  estimateEffortAdjustedPerformance,
  estimateOneRepMax,
} from "../../performance/progress.performance";
import { deriveLiftSessions } from "../../sessions/progress.sessions";
import { atDay, exposure } from "../../tests/progress.test.helpers";
import type { WorkoutRepObservations } from "../progress.dailyRepObservations.types";
import { deriveDailyFallbackStrengthObservations } from "../progress.fallbackStrength";
import { deriveWorkoutRepObservations } from "../progress.repObservations";

function workouts(
  history: Parameters<typeof deriveLiftSessions>[0],
  family: LiftFamily = "bench",
): WorkoutRepObservations[] {
  return deriveLiftSessions(history, family, atDay(100)).map((session) => ({
    workoutId: session.workoutId,
    family: session.family,
    finishedAt: session.finishedAt,
    observations: deriveWorkoutRepObservations(session.strengthSets),
  }));
}

it("returns no observations for empty input or workouts without eligible performances", () => {
  expect(deriveDailyFallbackStrengthObservations([])).toEqual([]);
  expect(
    deriveDailyFallbackStrengthObservations(
      workouts([exposure(0, { sets: [] })]),
    ),
  ).toEqual([]);
});

it("selects the highest raw e1RM across rep groups rather than the heaviest load", () => {
  const input = workouts([
    exposure(0, {
      sets: [
        { weight: 120, reps: 2, rpe: 10 },
        { weight: 100, reps: 8, rpe: 8 },
        { weight: 105, reps: 5, rpe: 8 },
      ],
    }),
  ]);
  const source = input[0].observations[2];
  const [daily] = deriveDailyFallbackStrengthObservations(input);

  expect(daily.rawE1rm).toBe(estimateOneRepMax(100, 8));
  expect(daily.adjustedE1rm).toBe(estimateEffortAdjustedPerformance(100, 8, 8));
  expect(daily.workoutCount).toBe(1);
  expect(daily.adjustedWorkoutCount).toBe(1);
  expect(daily.rawSources[0]).toBe(source.rawRepresentative);
  expect(daily.adjustedSources[0]).toBe(source.adjustedRepresentative);
});

it("selects raw and adjusted sources independently without the legacy proximity floor", () => {
  const [session] = deriveLiftSessions(
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
  );
  expect(session.adjustedRepresentative).toBe(session.strengthSets[1]);
  const [daily] = deriveDailyFallbackStrengthObservations([
    {
      ...session,
      observations: deriveWorkoutRepObservations(session.strengthSets),
    },
  ]);

  expect(daily.rawSources[0]).toBe(session.strengthSets[1]);
  expect(daily.adjustedSources[0]).toBe(session.strengthSets[0]);
  expect(daily.rawE1rm).toBe(estimateOneRepMax(100, 5));
  expect(daily.adjustedE1rm).toBe(estimateEffortAdjustedPerformance(94, 5, 7));
  expect(daily.adjustedSources[0]).toMatchObject({
    workoutId: "workout_0",
    workoutExerciseId: "entry_workout_0",
    setId: "set_workout_0_0",
  });
});

it("allows the best adjusted candidate to come from another rep group", () => {
  const input = workouts([
    exposure(0, {
      sets: [
        { weight: 120, reps: 4, rpe: 10 },
        { weight: 110, reps: 6, rpe: 7 },
      ],
    }),
  ]);
  const [daily] = deriveDailyFallbackStrengthObservations(input);

  expect(daily.rawSources[0].reps).toBe(4);
  expect(daily.adjustedSources[0].reps).toBe(6);
});

it.each([2, 3])(
  "takes medians of %i workout representatives, independently for each basis",
  (count) => {
    const input = workouts(
      [100, 110, 90].slice(0, count).map((weight, index) =>
        exposure(0, {
          id: `workout_${index}`,
          sets: [{ weight, rpe: index === 1 ? 10 : 8 }],
        }),
      ),
    );
    const [daily] = deriveDailyFallbackStrengthObservations(input);

    expect(daily.rawE1rm).toBe(count === 2 ? 118.125 : 112.5);
    expect(daily.adjustedE1rm).toBe(count === 2 ? 121.875 : 120);
    expect(daily.workoutCount).toBe(count);
    expect(daily.adjustedWorkoutCount).toBe(count);
  },
);

it("gives each workout one contribution regardless of sets or rep groups", () => {
  const input = workouts([
    exposure(0, {
      id: "many",
      sets: [
        { weight: 90, reps: 5 },
        { weight: 95, reps: 5 },
        { weight: 100, reps: 5 },
        { weight: 95, reps: 2 },
        { weight: 80, reps: 8 },
      ],
    }),
    exposure(0, { id: "one", sets: [{ weight: 110 }] }),
  ]);
  const [daily] = deriveDailyFallbackStrengthObservations(input);

  expect(daily.rawE1rm).toBe(118.125);
  expect(daily.workoutCount).toBe(2);
  expect(daily.rawSources).toHaveLength(2);
});

it.each([1, 0])(
  "preserves partial adjusted coverage with %i adjusted workouts out of two",
  (count) => {
    const [daily] = deriveDailyFallbackStrengthObservations(
      workouts([
        exposure(0, {
          id: "morning",
          sets: [{ weight: 100, rpe: count ? 8 : null }],
        }),
        exposure(0, { id: "evening", sets: [{ weight: 110, rpe: null }] }),
      ]),
    );

    expect(daily).toMatchObject({
      rawE1rm: 118.125,
      adjustedE1rm: count ? 120 : null,
      workoutCount: 2,
      adjustedWorkoutCount: count,
    });
    expect(daily.adjustedSources).toHaveLength(count);
  },
);

it.each([
  { reps: 10, rpe: 8 },
  { reps: 9, rpe: 7 },
  { reps: 5, rpe: 8.5 },
  { reps: 5, rpe: 11 },
  { reps: 5, rpe: NaN },
])(
  "does not count a recorded but unusable RPE as an adjusted estimate: %o",
  (set) => {
    const [daily] = deriveDailyFallbackStrengthObservations(
      workouts([exposure(0, { sets: [set] })]),
    );

    expect(daily.rawE1rm).toBe(estimateOneRepMax(100, set.reps));
    expect(daily.adjustedE1rm).toBeNull();
    expect(daily.workoutCount).toBe(1);
    expect(daily.adjustedWorkoutCount).toBe(0);
  },
);

it("reuses completed competition-lift eligibility and excludes invalid, warmup and easy sets", () => {
  const input = workouts([
    exposure(0, {
      sets: [
        { weight: 400, type: "warmup" },
        { weight: NaN },
        { weight: Infinity },
        { weight: 0 },
        { weight: -100 },
        { reps: 0 },
        { reps: 2.5 },
        { reps: 11 },
        { weight: 400, finished: false },
        { weight: 400, rpe: 6 },
        { weight: 100 },
      ],
    }),
    exposure(1, { active: true }),
    exposure(2, { variation: true }),
  ]);
  const [daily] = deriveDailyFallbackStrengthObservations(input);

  expect(daily.rawE1rm).toBe(112.5);
  expect(daily.rawSources.map((source) => source.setId)).toEqual([
    "set_workout_0_10",
  ]);
  expect(deriveDailyFallbackStrengthObservations(input)).toHaveLength(1);
});

it.each([NaN, Infinity, -Infinity, 0, -1])(
  "excludes invalid stored estimates %s without fabricating a value",
  (invalid) => {
    const input = workouts([exposure(0)]);
    const observation = input[0].observations[0];
    const [daily] = deriveDailyFallbackStrengthObservations([
      {
        ...input[0],
        observations: [
          {
            ...observation,
            adjustedRepresentative: {
              ...observation.rawRepresentative,
              adjustedEstimate: invalid,
            },
          },
        ],
      },
    ]);
    expect(daily.adjustedE1rm).toBeNull();
    expect(daily.adjustedWorkoutCount).toBe(0);
    expect(
      deriveDailyFallbackStrengthObservations([
        {
          ...input[0],
          observations: [
            {
              ...observation,
              rawRepresentative: {
                ...observation.rawRepresentative,
                rawEstimate: invalid,
              },
            },
          ],
        },
      ]),
    ).toEqual([]);
  },
);

it("deduplicates workouts and combines their rep groups deterministically", () => {
  const [workout] = workouts([
    exposure(0, {
      sets: [
        { weight: 100, reps: 2 },
        { weight: 100, reps: 8 },
      ],
    }),
  ]);
  const expected = deriveDailyFallbackStrengthObservations([workout]);
  const fragments = workout.observations.map((observation) => ({
    ...workout,
    observations: [observation],
  }));

  expect(deriveDailyFallbackStrengthObservations([workout, workout])).toEqual(
    expected,
  );
  expect(deriveDailyFallbackStrengthObservations(fragments)).toEqual(expected);
  expect(
    deriveDailyFallbackStrengthObservations([...fragments].reverse()),
  ).toEqual(expected);
});

it("separates days and competition families and returns them in deterministic order", () => {
  const input = (["squat", "bench", "deadlift"] as const).flatMap((family) =>
    workouts([exposure(0, { family }), exposure(7, { family })], family),
  );
  const daily = deriveDailyFallbackStrengthObservations([...input].reverse());

  expect(daily.map(({ day, family }) => [day, family])).toEqual(
    [0, 7].flatMap((day) =>
      ["bench", "deadlift", "squat"].map((family) => [
        localCalendarDay(atDay(day)),
        family,
      ]),
    ),
  );
});

it("groups by workout completion, even when a source set finished before midnight", () => {
  const input = workouts([exposure(0), exposure(1)]);
  const midnight = new Date(2026, 0, 6).getTime();
  const changed = input.map((workout, index) => ({
    ...workout,
    finishedAt: midnight + index,
  }));

  const [daily] = deriveDailyFallbackStrengthObservations(changed);
  expect(daily.day).toBe(localCalendarDay(midnight));
  expect(daily.workoutCount).toBe(2);
  expect(
    deriveDailyFallbackStrengthObservations([
      { ...changed[0], finishedAt: midnight - 1 },
      changed[1],
    ]),
  ).toHaveLength(2);
});

it("orders equal-estimate sources by completion and stable identities without mutating input", () => {
  const input = workouts([
    exposure(0, { id: "z", sets: [{ weight: 100 }, { weight: 100 }] }),
    exposure(0, { id: "a" }),
  ]);
  const snapshot = JSON.stringify(input);
  for (const workout of input) {
    for (const observation of workout.observations) {
      Object.freeze(observation.rawRepresentative);
      if (observation.adjustedRepresentative)
        Object.freeze(observation.adjustedRepresentative);
      Object.freeze(observation);
    }
    Object.freeze(workout.observations);
    Object.freeze(workout);
  }
  Object.freeze(input);
  const expected = deriveDailyFallbackStrengthObservations(input);
  const reordered = [...input].reverse().map((workout) => ({
    ...workout,
    observations: [...workout.observations].reverse(),
  }));

  expect(deriveDailyFallbackStrengthObservations(reordered)).toEqual(expected);
  expect(deriveDailyFallbackStrengthObservations(input)).toEqual(expected);
  expect(expected[0].rawSources.map((source) => source.workoutId)).toEqual([
    "a",
    "z",
  ]);
  expect(JSON.stringify(input)).toBe(snapshot);
});

it("resolves ties across rep groups using the existing strength-set comparator", () => {
  const [workout] = workouts([
    exposure(0, {
      sets: [
        { weight: 100, reps: 2 },
        { weight: 110, reps: 5 },
      ],
    }),
  ]);
  const tied = {
    ...workout,
    observations: workout.observations.map((observation) => {
      const source = {
        ...observation.rawRepresentative,
        rawEstimate: 120,
        adjustedEstimate: 125,
      };
      return {
        ...observation,
        rawRepresentative: source,
        adjustedRepresentative: source,
      };
    }),
  };
  const [daily] = deriveDailyFallbackStrengthObservations([tied]);

  expect(daily.rawSources[0].weight).toBe(110);
  expect(daily.adjustedSources[0].weight).toBe(110);
  expect(
    deriveDailyFallbackStrengthObservations([
      { ...tied, observations: [...tied.observations].reverse() },
    ]),
  ).toEqual([daily]);
});

it.each([
  [2026, 2, 29],
  [2026, 9, 25],
])("keeps local days around a DST transition: %i-%i-%i", (year, month, day) => {
  const midnight = new Date(year, month, day).getTime();
  const input = workouts([exposure(0), exposure(1), exposure(2)]).map(
    (workout, index) => ({
      ...workout,
      finishedAt: addLocalCalendarDays(midnight, index),
    }),
  );
  expect(
    deriveDailyFallbackStrengthObservations(input).map((item) => item.day),
  ).toEqual([
    localCalendarDay(midnight),
    localCalendarDay(midnight) + 1,
    localCalendarDay(midnight) + 2,
  ]);
});
