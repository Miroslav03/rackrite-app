import {
  addLocalCalendarDays,
  localCalendarDay,
} from "@/shared/utils/localCalendar";

import { deriveLiftSessions } from "../../sessions/progress.sessions";
import { atDay, exposure } from "../../tests/progress.test.helpers";
import { deriveDailyRepObservations } from "../progress.dailyRepObservations";
import type { WorkoutRepObservations } from "../progress.dailyRepObservations.types";
import { deriveWorkoutRepObservations } from "../progress.repObservations";

function workoutObservations(
  day: number,
  options: NonNullable<Parameters<typeof exposure>[1]> & {
    finishedAt?: number;
  } = {},
): WorkoutRepObservations {
  const item = exposure(day, options);

  if (options.finishedAt !== undefined) {
    const shift = options.finishedAt - atDay(day);
    item.workout.startedAt += shift;
    item.workout.finishedAt = options.finishedAt;
    for (const entry of item.entries) {
      for (const set of entry.sets) {
        if (set.finishedAt !== null) set.finishedAt += shift;
      }
    }
  }

  const [session] = deriveLiftSessions(
    [item],
    options.family ?? "bench",
    atDay(day + 2),
  );

  return {
    workoutId: session.workoutId,
    family: session.family,
    finishedAt: session.finishedAt,
    observations: deriveWorkoutRepObservations(session.strengthSets),
  };
}

it("returns no daily observations for empty input or workouts without eligible reps", () => {
  expect(deriveDailyRepObservations([])).toEqual([]);
  expect(
    deriveDailyRepObservations([workoutObservations(0, { sets: [] })]),
  ).toEqual([]);
});

it("preserves one workout's exact rep groups and source representatives", () => {
  const workout = workoutObservations(0, {
    sets: [
      { weight: 90, reps: 8 },
      { weight: 120, reps: 2 },
      { weight: 100, reps: 5 },
    ],
  });
  const daily = deriveDailyRepObservations([workout]);

  expect(daily.map((observation) => observation.reps)).toEqual([2, 5, 8]);
  for (const [index, observation] of daily.entries()) {
    const source = workout.observations[index];
    expect(observation).toEqual({
      family: "bench",
      day: localCalendarDay(workout.finishedAt),
      reps: source.reps,
      rawKg: source.rawRepresentative.weight,
      adjustedE1rm: source.adjustedRepresentative?.adjustedEstimate,
      workoutCount: 1,
      adjustedWorkoutCount: 1,
      rawSources: [source.rawRepresentative],
      adjustedSources: [source.adjustedRepresentative],
    });
  }
});

it("aggregates two same-day workouts using separate load and adjusted e1RM medians", () => {
  const morning = workoutObservations(0, {
    id: "morning",
    sets: [{ weight: 100 }],
  });
  const evening = workoutObservations(0, {
    id: "evening",
    sets: [{ weight: 105 }],
  });
  const daily = deriveDailyRepObservations([morning, evening]);

  expect(daily).toHaveLength(1);
  expect(daily[0]).toMatchObject({
    reps: 5,
    rawKg: 102.5,
    adjustedE1rm: 123,
    workoutCount: 2,
    adjustedWorkoutCount: 2,
  });
});

it("uses the middle representative for three same-day workouts", () => {
  const daily = deriveDailyRepObservations(
    [110, 90, 100].map((weight, index) =>
      workoutObservations(0, { id: `workout_${index}`, sets: [{ weight }] }),
    ),
  );

  expect(daily).toHaveLength(1);
  expect(daily[0]).toMatchObject({
    rawKg: 100,
    adjustedE1rm: 120,
    workoutCount: 3,
    adjustedWorkoutCount: 3,
  });
});

it("gives each workout one vote regardless of its number of eligible sets", () => {
  const morning = workoutObservations(0, {
    id: "morning",
    sets: [{ weight: 80 }, { weight: 90 }, { weight: 100 }],
  });
  const evening = workoutObservations(0, {
    id: "evening",
    sets: [{ weight: 110 }],
  });
  const [daily] = deriveDailyRepObservations([morning, evening]);

  expect(daily.rawKg).toBe(105);
  expect(daily.adjustedE1rm).toBe(126);
  expect(daily.workoutCount).toBe(2);
  expect(daily.rawSources).toHaveLength(2);
});

it("counts repeated observations from the same workout only once", () => {
  const morning = workoutObservations(0, {
    id: "morning",
    sets: [{ weight: 100 }],
  });
  const evening = workoutObservations(0, {
    id: "evening",
    sets: [{ weight: 110 }],
  });
  const expected = deriveDailyRepObservations([morning, evening]);

  expect(deriveDailyRepObservations([morning, evening, morning])).toEqual(
    expected,
  );
  expect(deriveDailyRepObservations([evening, morning, morning])).toEqual(
    expected,
  );
});

it("keeps different calendar days independent", () => {
  const daily = deriveDailyRepObservations([
    workoutObservations(0, { sets: [{ weight: 100 }] }),
    workoutObservations(3, { sets: [{ weight: 105 }] }),
  ]);

  expect(
    daily.map(({ day, rawKg, workoutCount }) => ({ day, rawKg, workoutCount })),
  ).toEqual([
    { day: localCalendarDay(atDay(0)), rawKg: 100, workoutCount: 1 },
    { day: localCalendarDay(atDay(3)), rawKg: 105, workoutCount: 1 },
  ]);
});

it("counts workouts independently for each exact rep group", () => {
  const daily = deriveDailyRepObservations([
    workoutObservations(0, {
      id: "morning",
      sets: [
        { weight: 120, reps: 2 },
        { weight: 100, reps: 5 },
      ],
    }),
    workoutObservations(0, { id: "evening", sets: [{ weight: 95, reps: 6 }] }),
  ]);

  expect(
    daily.map(({ reps, rawKg, workoutCount, adjustedWorkoutCount }) => ({
      reps,
      rawKg,
      workoutCount,
      adjustedWorkoutCount,
    })),
  ).toEqual([
    { reps: 2, rawKg: 120, workoutCount: 1, adjustedWorkoutCount: 1 },
    { reps: 5, rawKg: 100, workoutCount: 1, adjustedWorkoutCount: 1 },
    { reps: 6, rawKg: 95, workoutCount: 1, adjustedWorkoutCount: 1 },
  ]);
});

it("combines matching groups from two workouts without mixing their rep counts", () => {
  const first = workoutObservations(0, {
    id: "first",
    sets: [
      { weight: 120, reps: 2 },
      { weight: 100, reps: 5 },
      { weight: 90, reps: 8 },
    ],
  });
  const second = workoutObservations(0, {
    id: "second",
    sets: [
      { weight: 117.5, reps: 2 },
      { weight: 105, reps: 5 },
      { weight: 92.5, reps: 8 },
    ],
  });

  expect(
    deriveDailyRepObservations([first, second]).map(
      ({ reps, rawKg, workoutCount }) => ({ reps, rawKg, workoutCount }),
    ),
  ).toEqual([
    { reps: 2, rawKg: 118.75, workoutCount: 2 },
    { reps: 5, rawKg: 102.5, workoutCount: 2 },
    { reps: 8, rawKg: 91.25, workoutCount: 2 },
  ]);
});

it("preserves independent raw and adjusted source sets and their identities", () => {
  const workout = workoutObservations(0, {
    sets: [
      { weight: 105, rpe: 9 },
      { weight: 102.5, rpe: 7 },
    ],
  });
  const source = workout.observations[0];
  const [daily] = deriveDailyRepObservations([workout]);

  expect(daily.rawKg).toBe(105);
  expect(daily.adjustedE1rm).toBe(
    source.adjustedRepresentative?.adjustedEstimate,
  );
  expect(daily.rawSources[0]).toBe(source.rawRepresentative);
  expect(daily.adjustedSources[0]).toBe(source.adjustedRepresentative);
  expect(daily.rawSources[0]).toMatchObject({
    workoutId: "workout_0",
    workoutExerciseId: "entry_workout_0",
    setId: "set_workout_0_0",
  });
  expect(daily.adjustedSources[0]).toMatchObject({
    workoutId: "workout_0",
    workoutExerciseId: "entry_workout_0",
    setId: "set_workout_0_1",
  });
});

it("retains a partial adjusted median with coverage 1/2", () => {
  const morning = workoutObservations(0, {
    id: "morning",
    sets: [{ weight: 100, rpe: 8 }],
  });
  const evening = workoutObservations(0, {
    id: "evening",
    sets: [{ weight: 105, rpe: null }],
  });
  const [daily] = deriveDailyRepObservations([morning, evening]);

  expect(daily).toMatchObject({
    rawKg: 102.5,
    adjustedE1rm: 120,
    workoutCount: 2,
    adjustedWorkoutCount: 1,
  });
  expect(daily.rawSources).toHaveLength(2);
  expect(daily.adjustedSources).toHaveLength(1);
  expect(daily.adjustedSources[0]).toBe(
    morning.observations[0].adjustedRepresentative,
  );
});

it("preserves coverage 0/2 and a null adjusted median when neither workout has RPE", () => {
  const [daily] = deriveDailyRepObservations(
    [100, 105].map((weight, index) =>
      workoutObservations(0, {
        id: `workout_${index}`,
        sets: [{ weight, rpe: null }],
      }),
    ),
  );

  expect(daily).toMatchObject({
    rawKg: 102.5,
    adjustedE1rm: null,
    workoutCount: 2,
    adjustedWorkoutCount: 0,
    adjustedSources: [],
  });
});

it("keeps adjusted coverage specific to the rep group", () => {
  const daily = deriveDailyRepObservations([
    workoutObservations(0, { id: "morning", sets: [{ reps: 2 }, { reps: 5 }] }),
    workoutObservations(0, { id: "evening", sets: [{ reps: 2, rpe: null }] }),
  ]);

  expect(
    daily.map(({ reps, workoutCount, adjustedWorkoutCount }) => ({
      reps,
      workoutCount,
      adjustedWorkoutCount,
    })),
  ).toEqual([
    { reps: 2, workoutCount: 2, adjustedWorkoutCount: 1 },
    { reps: 5, workoutCount: 1, adjustedWorkoutCount: 1 },
  ]);
});

it.each([
  { reps: 10, rpe: 8 },
  { reps: 9, rpe: 7 },
  { reps: 5, rpe: 7.5 },
])("does not invent an excluded adjusted estimate for %o", (set) => {
  const [daily] = deriveDailyRepObservations([
    workoutObservations(0, { sets: [set] }),
  ]);
  expect(daily).toMatchObject({
    rawKg: 100,
    adjustedE1rm: null,
    workoutCount: 1,
    adjustedWorkoutCount: 0,
    adjustedSources: [],
  });
});

it("keeps different lift families separate even when they share a workout ID", () => {
  const daily = deriveDailyRepObservations([
    workoutObservations(0, { family: "squat", sets: [{ weight: 150 }] }),
    workoutObservations(0, { family: "bench", sets: [{ weight: 100 }] }),
    workoutObservations(0, { family: "deadlift", sets: [{ weight: 200 }] }),
  ]);

  expect(
    daily.map(({ family, rawKg, workoutCount }) => ({
      family,
      rawKg,
      workoutCount,
    })),
  ).toEqual([
    { family: "bench", rawKg: 100, workoutCount: 1 },
    { family: "deadlift", rawKg: 200, workoutCount: 1 },
    { family: "squat", rawKg: 150, workoutCount: 1 },
  ]);
});

it("adds no observations for skipped days or weeks and does not group recurring weekdays", () => {
  const days = [0, 3, 14, 35];
  const daily = deriveDailyRepObservations(
    days.map((day) => workoutObservations(day)),
  );

  expect(daily.map((observation) => observation.day)).toEqual(
    days.map((day) => localCalendarDay(atDay(day))),
  );
  expect(daily.every((observation) => observation.workoutCount === 1)).toBe(
    true,
  );
});

it("orders observations by local day, lift family, then exact reps", () => {
  const daily = deriveDailyRepObservations([
    workoutObservations(3, {
      family: "bench",
      sets: [{ reps: 5 }, { reps: 2 }],
    }),
    workoutObservations(0, {
      family: "squat",
      sets: [{ reps: 5 }, { reps: 2 }],
    }),
    workoutObservations(0, {
      family: "bench",
      sets: [{ reps: 5 }, { reps: 2 }],
    }),
  ]);

  expect(daily.map(({ day, family, reps }) => [day, family, reps])).toEqual([
    [localCalendarDay(atDay(0)), "bench", 2],
    [localCalendarDay(atDay(0)), "bench", 5],
    [localCalendarDay(atDay(0)), "squat", 2],
    [localCalendarDay(atDay(0)), "squat", 5],
    [localCalendarDay(atDay(3)), "bench", 2],
    [localCalendarDay(atDay(3)), "bench", 5],
  ]);
});

it("orders sources by workout completion and stable workout identity", () => {
  const firstTime = new Date(2026, 0, 5, 8).getTime();
  const later = workoutObservations(0, {
    id: "later",
    finishedAt: firstTime + 3_600_000,
  });
  const z = workoutObservations(0, { id: "z", finishedAt: firstTime });
  const a = workoutObservations(0, { id: "a", finishedAt: firstTime });
  const [daily] = deriveDailyRepObservations([later, z, a]);

  expect(daily.rawSources.map((source) => source.workoutId)).toEqual([
    "a",
    "z",
    "later",
  ]);
  expect(daily.adjustedSources.map((source) => source.workoutId)).toEqual([
    "a",
    "z",
    "later",
  ]);
});

it("produces identical output when workouts and their rep observations are reordered", () => {
  const workouts = [
    workoutObservations(0, { id: "first", sets: [{ reps: 2 }, { reps: 5 }] }),
    workoutObservations(0, {
      id: "second",
      sets: [{ weight: 105, reps: 5, rpe: null }],
    }),
    workoutObservations(2, {
      family: "squat",
      sets: [{ reps: 8 }, { reps: 3 }],
    }),
  ];
  const expected = deriveDailyRepObservations(workouts);
  const reordered = [...workouts].reverse().map((workout) => ({
    ...workout,
    observations: [...workout.observations].reverse(),
  }));

  expect(deriveDailyRepObservations(reordered)).toEqual(expected);
  expect(
    deriveDailyRepObservations([workouts[1], workouts[2], workouts[0]]),
  ).toEqual(expected);
});

it.each([
  [2026, 2, 29],
  [2026, 9, 25],
  [2026, 11, 31],
])(
  "respects local midnight at seasonal and year boundaries for %i-%i-%i",
  (year, month, date) => {
    const before = new Date(year, month, date, 23, 59, 59).getTime();
    const after = addLocalCalendarDays(
      new Date(year, month, date, 0, 0, 1).getTime(),
      1,
    );
    const fixtureDay = localCalendarDay(before) - localCalendarDay(atDay(0));
    const daily = deriveDailyRepObservations([
      workoutObservations(fixtureDay, { id: "before", finishedAt: before }),
      workoutObservations(fixtureDay, { id: "after", finishedAt: after }),
    ]);

    expect(daily.map((observation) => observation.day)).toEqual([
      localCalendarDay(before),
      localCalendarDay(after),
    ]);
    expect(daily.map((observation) => observation.workoutCount)).toEqual([
      1, 1,
    ]);
  },
);

it("combines early and late workouts on the same local calendar day", () => {
  const early = new Date(2026, 0, 5, 0, 30).getTime();
  const late = new Date(2026, 0, 5, 23, 30).getTime();
  const daily = deriveDailyRepObservations([
    workoutObservations(0, { id: "early", finishedAt: early }),
    workoutObservations(0, { id: "late", finishedAt: late }),
  ]);

  expect(daily).toHaveLength(1);
  expect(daily[0].day).toBe(localCalendarDay(early));
  expect(daily[0].workoutCount).toBe(2);
});

it("groups by workout completion when its selected set finished before midnight", () => {
  const finishedAt = new Date(2026, 0, 6, 0, 0, 1).getTime();
  const workout = workoutObservations(1, { finishedAt });
  const source = workout.observations[0].rawRepresentative;
  const [daily] = deriveDailyRepObservations([workout]);

  expect(localCalendarDay(source.finishedAt)).toBe(
    localCalendarDay(finishedAt) - 1,
  );
  expect(daily.day).toBe(localCalendarDay(finishedAt));
});

it("does not round intermediate medians", () => {
  const first = workoutObservations(0, {
    id: "first",
    sets: [{ weight: 100.01 }],
  });
  const second = workoutObservations(0, {
    id: "second",
    sets: [{ weight: 100.02 }],
  });
  const [daily] = deriveDailyRepObservations([first, second]);

  expect(daily.rawKg).toBe(100.01 / 2 + 100.02 / 2);
  expect(daily.adjustedE1rm).toBe(120.012 / 2 + 120.024 / 2);
});

it("leaves frozen inputs unchanged and retains original source objects", () => {
  const workouts = [
    workoutObservations(0, { id: "first", sets: [{ reps: 8 }, { reps: 5 }] }),
    workoutObservations(0, { id: "second", sets: [{ reps: 5, rpe: null }] }),
  ];
  const original = JSON.stringify(workouts);
  for (const workout of workouts) {
    for (const observation of workout.observations) {
      Object.freeze(observation.rawRepresentative);
      if (observation.adjustedRepresentative !== null)
        Object.freeze(observation.adjustedRepresentative);
      Object.freeze(observation);
    }
    Object.freeze(workout.observations);
    Object.freeze(workout);
  }
  Object.freeze(workouts);
  const daily = deriveDailyRepObservations(workouts);

  expect(JSON.stringify(workouts)).toBe(original);
  expect(deriveDailyRepObservations(workouts)).toEqual(daily);
  expect(daily[0].rawSources[0]).toBe(
    workouts[0].observations[0].rawRepresentative,
  );
  expect(daily[0].adjustedSources[0]).toBe(
    workouts[0].observations[0].adjustedRepresentative,
  );
});
