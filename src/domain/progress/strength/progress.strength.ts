import { localCalendarDay } from "@/shared/utils/localCalendar";

import { available } from "../measurements/progress.measurements";
import { median } from "../measurements/progress.measurements.utils";
import type { ProgressConfig } from "../progress.config";
import type { RepresentativeSet } from "../sessions/progress.sessions.types";
import type {
  ComparisonHistory,
  EstimateBasis,
  TrendComparison,
} from "../trends/progress.trends.types";

import type {
  ComparableBucket,
  StrengthComparison,
  StrengthDay,
} from "./progress.strength.types";
import {
  dailyBestSets,
  rpeBand,
  weightedMedian,
} from "./progress.strength.utils";

function bucketKey(set: RepresentativeSet, includeEffort: boolean): string {
  if (!includeEffort) {
    return String(set.reps);
  }

  return `${set.reps}:${rpeBand(set.rpe)}`;
}

function groupComparableSets(
  history: ComparisonHistory,
  includeEffort: boolean,
  config: ProgressConfig,
): Map<string, RepresentativeSet[]> {
  const groups = new Map<string, RepresentativeSet[]>();

  for (const session of history.comparisonSessions) {
    for (const set of session.strengthSets) {
      if (set.reps > config.comparableMaximumReps) {
        continue;
      }

      const band = rpeBand(set.rpe);

      if (includeEffort && band === null) {
        continue;
      }

      const key = bucketKey(set, includeEffort);
      const sets = groups.get(key) ?? [];

      sets.push(set);
      groups.set(key, sets);
    }
  }

  return groups;
}

function hasComparableRpe(
  baselineSets: RepresentativeSet[],
  recentSets: RepresentativeSet[],
  config: ProgressConfig,
): boolean {
  const baselineRpe = median(
    baselineSets.flatMap((set) => (set.rpe === null ? [] : [set.rpe])),
  );

  const recentRpe = median(
    recentSets.flatMap((set) => (set.rpe === null ? [] : [set.rpe])),
  );

  if (baselineRpe === null || recentRpe === null) {
    return false;
  }

  return Math.abs(recentRpe - baselineRpe) <= config.comparableRpeShift;
}

function createComparableBucket(
  key: string,
  sets: RepresentativeSet[],
  history: ComparisonHistory,
  includeEffort: boolean,
  config: ProgressConfig,
): ComparableBucket | null {
  const sources = dailyBestSets(sets);

  const baselineSets = sources.filter(
    (set) => set.workoutFinishedAt < history.recentStartsAt,
  );

  const recentSets = sources.filter(
    (set) => set.workoutFinishedAt >= history.recentStartsAt,
  );

  if (
    baselineSets.length < config.minimumHalfDays ||
    recentSets.length < config.minimumHalfDays
  ) {
    return null;
  }

  if (includeEffort && !hasComparableRpe(baselineSets, recentSets, config)) {
    return null;
  }

  const baseline = median(baselineSets.map((set) => set.weight));
  const recent = median(recentSets.map((set) => set.weight));

  if (baseline === null || recent === null) {
    return null;
  }

  const change = (recent / baseline - 1) * 100;

  if (!Number.isFinite(change)) {
    return null;
  }

  return {
    key,
    reps: sources[0].reps,
    baseline,
    recent,
    change,
    weight: Math.min(baselineSets.length, recentSets.length),
    baselineDays: baselineSets.length,
    recentDays: recentSets.length,
    sources,
  };
}

function matchedBuckets(
  history: ComparisonHistory,
  includeEffort: boolean,
  config: ProgressConfig,
): ComparableBucket[] {
  const groups = groupComparableSets(history, includeEffort, config);
  const buckets: ComparableBucket[] = [];

  for (const [key, sets] of groups) {
    const bucket = createComparableBucket(
      key,
      sets,
      history,
      includeEffort,
      config,
    );

    if (bucket) {
      buckets.push(bucket);
    }
  }

  return buckets.sort((a, b) => a.key.localeCompare(b.key));
}

function matchedDaySets(buckets: ComparableBucket[], recentStartsAt: number) {
  const baselineDays = new Set<number>();
  const recentDays = new Set<number>();

  for (const bucket of buckets) {
    for (const set of bucket.sources) {
      const day = localCalendarDay(set.workoutFinishedAt);

      if (set.workoutFinishedAt < recentStartsAt) {
        baselineDays.add(day);
      } else {
        recentDays.add(day);
      }
    }
  }

  return {
    baselineDays,
    recentDays,
  };
}

function matchedSpan(
  baselineDays: Set<number>,
  recentDays: Set<number>,
): number {
  const days = [...baselineDays, ...recentDays];

  if (days.length === 0) {
    return 0;
  }

  return Math.max(...days) - Math.min(...days);
}

function buildMatchedDailyStrength(
  history: ComparisonHistory,
  buckets: ComparableBucket[],
  includeEffort: boolean,
): StrengthDay[] {
  return history.contextDays.map((day) => {
    const sources: RepresentativeSet[] = [];

    const values = buckets.flatMap((bucket) => {
      const candidates = day.sessions
        .flatMap((session) => session.strengthSets)
        .filter((set) => {
          if (set.reps !== bucket.reps) {
            return false;
          }

          if (!includeEffort) {
            return true;
          }

          return `${set.reps}:${rpeBand(set.rpe)}` === bucket.key;
        });

      const bestSet = dailyBestSets(candidates)[0];

      if (!bestSet) {
        return [];
      }

      const value = (bestSet.weight / bucket.baseline) * 100;

      if (!Number.isFinite(value)) {
        return [];
      }

      sources.push(bestSet);

      return [
        {
          value,
          weight: bucket.weight,
        },
      ];
    });

    return {
      day: day.day,
      finishedAt: day.finishedAt,
      value: weightedMedian(values),
      sources,
    };
  });
}

function buildEstimatedDailyStrength(
  history: ComparisonHistory,
  estimateBasis: EstimateBasis,
  baseline: number | null,
): StrengthDay[] {
  return history.contextDays.map((day) => {
    const value = estimateBasis === "effort_adjusted" ? day.adjusted : day.raw;

    const normalized =
      baseline !== null && baseline > 0 && value !== null
        ? (value / baseline) * 100
        : null;

    return {
      day: day.day,
      finishedAt: day.finishedAt,
      value:
        normalized !== null && Number.isFinite(normalized) ? normalized : null,
      sources: day.sessions.flatMap((session) => {
        const set =
          estimateBasis === "effort_adjusted"
            ? session.adjustedRepresentative
            : session.rawRepresentative;

        return set ? [set] : [];
      }),
    };
  });
}

export function deriveStrengthComparison(
  history: ComparisonHistory,
  raw: TrendComparison,
  adjusted: TrendComparison,
  estimateBasis: EstimateBasis,
  rpeAdequate: boolean,
  config: ProgressConfig,
): StrengthComparison {
  const buckets = matchedBuckets(history, rpeAdequate, config);

  const { baselineDays, recentDays } = matchedDaySets(
    buckets,
    history.recentStartsAt,
  );

  const baselineCoverage = baselineDays.size / Math.max(1, raw.baselineDays);
  const recentCoverage = recentDays.size / Math.max(1, raw.recentDays);

  const span = matchedSpan(baselineDays, recentDays);

  const hasMatchedComparison =
    buckets.length > 0 &&
    span >= config.minimumSpanDays &&
    baselineCoverage >= config.comparableDayCoverage &&
    recentCoverage >= config.comparableDayCoverage;

  if (hasMatchedComparison) {
    const change =
      weightedMedian(
        buckets.map((bucket) => ({
          value: bucket.change,
          weight: bucket.weight,
        })),
      ) ?? 0;

    const basis = rpeAdequate ? "matched_reps_rpe" : "matched_reps";

    return {
      window: raw.window,
      baseline: 100,
      recent: 100 + change,
      change: available(change),
      baselineDays: baselineDays.size,
      recentDays: recentDays.size,
      basis,
      cohortKey: `${basis}:${buckets.map((bucket) => bucket.key).join(",")}`,
      buckets,
      daily: buildMatchedDailyStrength(history, buckets, rpeAdequate),
      baselineCoverage,
      recentCoverage,
    };
  }

  const comparison = estimateBasis === "effort_adjusted" ? adjusted : raw;

  const baseline = comparison.baseline;

  return {
    ...comparison,
    baseline: baseline === null ? null : 100,
    recent:
      comparison.change.status === "available"
        ? 100 + comparison.change.value
        : null,
    basis: estimateBasis,
    cohortKey: estimateBasis,
    buckets: [],
    baselineCoverage: comparison.baselineDays / Math.max(1, raw.baselineDays),
    recentCoverage: comparison.recentDays / Math.max(1, raw.recentDays),
    daily: buildEstimatedDailyStrength(history, estimateBasis, baseline),
  };
}
