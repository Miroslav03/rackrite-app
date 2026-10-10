import { localCalendarDay } from "@/shared/utils/localCalendar";

import type { LiftAnalysisCore } from "../analysis/progress.analysis.types";
import type { ProgressConfig } from "../progress.config";
import {
  dailyBestSets,
  normalizedDispersion,
} from "../strength/progress.strength.utils";

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

  const days = analysis.trends.contextDays
    .filter((day) => today - day.day <= config.benchmarkLookbackDays)
    .slice(-config.benchmarkWindowDays);
  const candidates = days.flatMap((day) =>
    day.sessions.flatMap((session) => session.strengthSets),
  );
  const buckets: BenchmarkReferences[] = [];
  for (
    let reps = config.benchmarkMinimumReps;
    reps <= config.benchmarkMaximumReps;
    reps++
  ) {
    const sources = dailyBestSets(
      candidates.filter((set) => set.reps === reps),
    );
    const reference = sources[sources.length - 1];
    if (
      !reference ||
      sources.length < config.benchmarkMinimumDays ||
      today - localCalendarDay(reference.workoutFinishedAt) >
        config.benchmarkRecentDays ||
      localCalendarDay(reference.workoutFinishedAt) -
        localCalendarDay(
          sources[sources.length - config.benchmarkMinimumDays]
            .workoutFinishedAt,
        ) <
        config.benchmarkSpanDays
    )
      continue;
    buckets.push({ reps, sources, reference });
  }
  buckets.sort(
    (a, b) =>
      localCalendarDay(b.reference.workoutFinishedAt) -
        localCalendarDay(a.reference.workoutFinishedAt) ||
      b.sources.length - a.sources.length ||
      normalizedDispersion(a.sources) - normalizedDispersion(b.sources) ||
      a.reps - b.reps ||
      a.reference.setId.localeCompare(b.reference.setId),
  );
  const selected = buckets[0];
  return selected
    ? {
        ...selected,
        sources: selected.sources.slice(-config.benchmarkMinimumDays),
      }
    : null;
}
