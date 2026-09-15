import type { LiftFamily, SetType } from "@/domain/domain.types";

import type { CompetitionLiftExposure } from "../history/progress.history.types";

import { addLocalCalendarDays } from "@/shared/utils/localCalendar";

export const START = new Date(2026, 0, 5, 12).getTime();

/**
 * Optional set values for building test history. Tests can specify only
 * the details relevant to a scenario while the fixture fills in defaults.
 */
export type FixtureSet = {
  weight?: number | null;
  reps?: number | null;
  rpe?: number | null;
  type?: SetType;
  finished?: boolean;
};

export function exposure(
  day: number,
  options: {
    family?: LiftFamily;
    sets?: FixtureSet[];
    id?: string;
    active?: boolean;
    variation?: boolean;
  } = {},
): CompetitionLiftExposure {
  const family = options.family ?? "bench",
    id = options.id ?? `workout_${day}`;
  const finishedAt = addLocalCalendarDays(START, day);
  const exerciseId = options.variation
    ? `paused_${family}`
    : `competition_${family}`;
  const entryId = `entry_${id}`;

  return {
    workout: {
      id,
      status: options.active ? "active" : "completed",
      startedAt: finishedAt - 3_600_000,
      finishedAt: options.active ? null : finishedAt,
    },
    exercise: {
      id: exerciseId,
      kind: options.variation ? "lift_variation" : "competition_lift",
      origin: "built_in",
      liftFamily: family,
    },
    entries: [
      {
        exercise: { id: entryId, workoutId: id, exerciseId, orderIndex: 0 },
        sets: (options.sets ?? [{}]).map((set, index) => ({
          id: `set_${id}_${index}`,
          workoutExerciseId: entryId,
          setIndex: index,
          type: set.type ?? "working",
          weight: set.weight === undefined ? 100 : set.weight,
          reps: set.reps === undefined ? 5 : set.reps,
          rpe: set.rpe === undefined ? 8 : set.rpe,
          finishedAt:
            set.finished === false ? null : finishedAt - 60_000 + index,
        })),
      },
    ],
  };
}

export function series(
  weights: readonly number[],
  rpes: readonly (number | null)[] = [],
  reps = 5,
  interval = 4,
): CompetitionLiftExposure[] {
  return weights.map((weight, index) =>
    exposure(index * interval, {
      sets: [
        { weight, rpe: rpes[index] === undefined ? 8 : rpes[index], reps },
      ],
    }),
  );
}

export function atDay(day: number): number {
  return addLocalCalendarDays(START, day);
}
