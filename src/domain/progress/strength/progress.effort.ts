import { localCalendarDay } from "@/shared/utils/localCalendar";

import { available } from "../measurements/progress.measurements";
import type { Measurement } from "../measurements/progress.measurements.types";
import { median } from "../measurements/progress.measurements.utils";
import type { ProgressConfig } from "../progress.config";
import type {
  LiftSessionMetrics,
  RepresentativeSet,
} from "../sessions/progress.sessions.types";
import type { ComparisonHistory } from "../trends/progress.trends.types";

import type { EffortComparison, StrengthDay } from "./progress.strength.types";
import { weightedMedian } from "./progress.strength.utils";

function getSetKey(set: RepresentativeSet): string {
  return `${set.reps}:${set.weight}`;
}

function getComparableEffortSets(
  sessions: readonly LiftSessionMetrics[],
  maximumReps: number,
): RepresentativeSet[] {
  return sessions
    .flatMap((session) => session.strengthSets)
    .filter((set) => set.rpe !== null && set.reps <= maximumReps);
}

function effortDays(sets: readonly RepresentativeSet[]): StrengthDay[] {
  const setsByDay = new Map<number, RepresentativeSet[]>();

  for (const set of sets) {
    if (set.rpe === null) continue;

    const day = localCalendarDay(set.workoutFinishedAt);
    const daySets = setsByDay.get(day) ?? [];

    daySets.push(set);
    setsByDay.set(day, daySets);
  }

  return [...setsByDay.entries()]
    .sort(([dayA], [dayB]) => dayA - dayB)
    .map(([day, daySets]) => ({
      day,
      finishedAt: Math.max(...daySets.map((set) => set.workoutFinishedAt)),
      sources: daySets,
      value: median(
        daySets.flatMap((set) => (set.rpe === null ? [] : [set.rpe])),
      ),
    }));
}

export function deriveEffortComparison(
  history: ComparisonHistory,
  sessions: readonly LiftSessionMetrics[],
  typicalChange: Measurement,
  rpeAdequate: boolean,
  config: ProgressConfig,
): EffortComparison {
  const comparableSets = getComparableEffortSets(
    sessions,
    config.comparableMaximumReps,
  );

  const comparisonSets = getComparableEffortSets(
    history.comparisonSessions,
    config.comparableMaximumReps,
  );

  const comparisonKeys = [...new Set(comparisonSets.map(getSetKey))].sort();

  const comparisonWorkoutIds = new Set(
    history.comparisonSessions.map((session) => session.workoutId),
  );

  const cohorts = comparisonKeys.flatMap((key) => {
    const daily = effortDays(
      comparableSets.filter((set) => getSetKey(set) === key),
    );

    const eligibleDays = daily.filter((day) =>
      day.sources.some((set) => comparisonWorkoutIds.has(set.workoutId)),
    );

    const baselineDays = eligibleDays.filter(
      (day) => day.finishedAt < history.recentStartsAt,
    );

    const recentDays = eligibleDays.filter(
      (day) => day.finishedAt >= history.recentStartsAt,
    );

    const baseline = median(
      baselineDays.flatMap((day) => (day.value === null ? [] : [day.value])),
    );

    const recent = median(
      recentDays.flatMap((day) => (day.value === null ? [] : [day.value])),
    );

    const hasEnoughBaselineDays = baselineDays.length >= config.minimumHalfDays;

    const hasEnoughRecentDays = recentDays.length >= config.minimumHalfDays;

    if (
      !hasEnoughBaselineDays ||
      !hasEnoughRecentDays ||
      baseline === null ||
      recent === null ||
      eligibleDays[eligibleDays.length - 1].day - eligibleDays[0].day <
        config.minimumSpanDays
    ) {
      return [];
    }

    return [
      {
        daily,
        change: recent - baseline,
        weight: Math.min(baselineDays.length, recentDays.length),
      },
    ];
  });

  if (rpeAdequate && cohorts.length > 0) {
    const change =
      weightedMedian(
        cohorts.map((cohort) => ({
          value: cohort.change,
          weight: cohort.weight,
        })),
      ) ?? 0;

    return {
      basis: "matched",
      change: available(change),

      sources: cohorts
        .flatMap((cohort) =>
          cohort.daily.flatMap((day) =>
            day.value === null ? [] : day.sources,
          ),
        )
        .sort(
          (a, b) =>
            localCalendarDay(a.workoutFinishedAt) -
            localCalendarDay(b.workoutFinishedAt),
        ),
    };
  }

  return {
    basis: "typical",
    change: typicalChange,

    sources: [],
  };
}
