import { localCalendarDay } from "@/shared/utils/localCalendar";

import type { LiftAnalysisCore } from "../analysis/progress.analysis.types";
import type { ProgressConfig } from "../progress.config";

import type { BenchmarkReferences } from "./progress.benchmark.types";

export function roundLoadDown(
  weight: number,
  increment: number,
): number | null {
  if (
    !Number.isFinite(weight) ||
    !Number.isFinite(increment) ||
    weight <= 0 ||
    increment <= 0
  )
    return null;

  const quotient = weight / increment;
  const result = Number(
    (
      Math.floor(quotient + Number.EPSILON * Math.max(1, quotient) * 4) *
      increment
    ).toFixed(8),
  );

  return result > 0 && result <= weight + 1e-8 ? result : null;
}

export function selectBenchmarkReferences(
  analysis: LiftAnalysisCore,
  config: ProgressConfig,
): BenchmarkReferences | null {
  const today = localCalendarDay(analysis.analysisTime);

  const candidates = analysis.trends.contextDays
    .filter((day) => today - day.day <= config.benchmarkLookbackDays)
    .slice(-config.benchmarkWindowDays)
    .flatMap((day) => {
      const session = [...day.sessions].sort(
        (a, b) =>
          b.finishedAt - a.finishedAt || a.workoutId.localeCompare(b.workoutId),
      )[0];
      const reference =
        analysis.trends.basis === "effort_adjusted"
          ? session.adjustedRepresentative
          : session.rawRepresentative;

      return reference ? [reference] : [];
    });

  const counts = new Map<number, number>();

  for (const set of candidates)
    if (
      set.reps >= config.benchmarkMinimumReps &&
      set.reps <= config.benchmarkMaximumReps
    )
      counts.set(set.reps, (counts.get(set.reps) ?? 0) + 1);

  const reps = [...counts.entries()].find(
    ([, count]) => count >= config.benchmarkMinimumDays,
  )?.[0];

  if (reps === undefined) return null;

  const sources = candidates
    .filter((set) => set.reps === reps)
    .slice(-config.benchmarkMinimumDays);
  const reference = sources[sources.length - 1];

  if (
    !reference ||
    sources.length < config.benchmarkMinimumDays ||
    today - localCalendarDay(reference.workoutFinishedAt) >
      config.benchmarkRecentDays ||
    localCalendarDay(reference.workoutFinishedAt) -
      localCalendarDay(sources[0].workoutFinishedAt) <
      config.benchmarkSpanDays
  )
    return null;

  return { reps, sources, reference };
}
