import type { LiftFamily } from "@/domain/domain.types";

import { validTimestamp } from "@/shared/utils/localCalendar";

import type { CompetitionLiftExposure } from "../history/progress.history.types";
import { median } from "../measurements/progress.measurements.utils";
import {
  estimateEffortAdjustedPerformance,
  estimateOneRepMax,
} from "../performance/progress.performance";
import { validRpe } from "../performance/progress.performance.utils";
import { type ProgressConfig, progressConfig } from "../progress.config";

import type {
  LiftSessionMetrics,
  RepresentativeSet,
} from "./progress.sessions.types";
import { isValidTrainingSet, orderedIndex } from "./progress.sessions.utils";

export function deriveLiftSessions(
  history: readonly CompetitionLiftExposure[],
  family: LiftFamily,
  analysisTime: number,
  config: ProgressConfig = progressConfig,
): LiftSessionMetrics[] {
  const completedCompetitionHistory = history.filter(
    (item) =>
      item.exercise.kind === "competition_lift" &&
      item.exercise.origin === "built_in" &&
      item.workout.status === "completed" &&
      validTimestamp(item.workout.startedAt) &&
      validTimestamp(item.workout.finishedAt) &&
      item.workout.finishedAt >= item.workout.startedAt &&
      item.workout.finishedAt <= analysisTime,
  );

  const exposures = completedCompetitionHistory.filter(
    (item) => item.exercise.liftFamily === family,
  );

  const ambiguous = new Set(exposures.map((item) => item.exercise.id)).size > 1;

  const groups = new Map<string, CompetitionLiftExposure[]>();

  for (const item of exposures) {
    const list = groups.get(item.workout.id) ?? [];

    list.push(item);
    groups.set(item.workout.id, list);
  }

  // A set identity cannot legitimately refer to different source records,
  // including across workouts.
  const signatures = new Map<string, string>();
  const conflictingIds = new Set<string>();

  for (const item of completedCompetitionHistory) {
    for (const entry of item.entries) {
      for (const set of entry.sets) {
        const signature = JSON.stringify([
          item.workout,
          item.exercise.id,
          entry.exercise,
          set,
        ]);

        const previous = signatures.get(set.id);

        if (previous !== undefined && previous !== signature) {
          conflictingIds.add(set.id);
        }

        signatures.set(set.id, signature);
      }
    }
  }

  const sessions: LiftSessionMetrics[] = [];

  for (const items of groups.values()) {
    const workout = items[0].workout;

    if (
      workout.status !== "completed" ||
      !validTimestamp(workout.startedAt) ||
      !validTimestamp(workout.finishedAt) ||
      workout.finishedAt < workout.startedAt ||
      workout.finishedAt > analysisTime
    ) {
      continue;
    }

    if (
      items.some(
        (item) => JSON.stringify(item.workout) !== JSON.stringify(workout),
      )
    ) {
      continue;
    }

    const result: LiftSessionMetrics = {
      workoutId: workout.id,
      family,
      finishedAt: workout.finishedAt,

      rawRepresentative: null,
      adjustedRepresentative: null,

      volume: 0,

      validSetCount: 0,
      completedSetCount: 0,
      invalidSetCount: 0,

      rpeSetCount: 0,
      highEffortSetCount: 0,
      typicalRpe: null,

      issues: ambiguous ? ["ambiguous_identity"] : [],
    };

    if (ambiguous) {
      sessions.push(result);
      continue;
    }

    const sources = items.flatMap((item) =>
      item.entries.flatMap((entry) =>
        entry.sets.map((set) => ({
          set,
          entry: entry.exercise,
          workout: item.workout,
        })),
      ),
    );

    sources.sort(
      (a, b) =>
        orderedIndex(a.entry.orderIndex) - orderedIndex(b.entry.orderIndex) ||
        orderedIndex(a.set.setIndex) - orderedIndex(b.set.setIndex) ||
        a.entry.id.localeCompare(b.entry.id) ||
        a.set.id.localeCompare(b.set.id),
    );

    const seen = new Set<string>();
    const rpes: number[] = [];
    const adjustedCandidates: RepresentativeSet[] = [];

    for (const source of sources) {
      const { set, entry } = source;

      if (seen.has(set.id)) {
        continue;
      }

      seen.add(set.id);

      if (set.finishedAt === null || set.type === "warmup") {
        continue;
      }

      result.completedSetCount++;

      if (conflictingIds.has(set.id)) {
        result.invalidSetCount++;
        result.issues.push("conflicting_duplicate");

        continue;
      }

      if (
        entry.workoutId !== workout.id ||
        entry.exerciseId !== items[0].exercise.id ||
        set.workoutExerciseId !== entry.id
      ) {
        result.invalidSetCount++;
        result.issues.push("invalid_ownership");

        continue;
      }

      if (
        !isValidTrainingSet(source, workout.finishedAt) ||
        !Number.isFinite(result.volume + source.set.weight * source.set.reps)
      ) {
        result.invalidSetCount++;
        result.issues.push("invalid_set");

        continue;
      }

      const { weight, reps, finishedAt } = source.set;

      result.validSetCount++;
      result.volume += weight * reps;

      const rpe = validRpe(set.rpe) ? set.rpe : null;

      if (rpe !== null) {
        rpes.push(rpe);

        result.rpeSetCount++;

        if (rpe >= config.highEffortRpe) {
          result.highEffortSetCount++;
        }
      } else if (set.rpe !== null) {
        result.issues.push("invalid_rpe");
      }

      if (rpe !== null && rpe < config.minimumPerformanceRpe) {
        continue;
      }

      const rawEstimate = estimateOneRepMax(weight, reps, config);

      if (rawEstimate === null) {
        continue;
      }

      const adjustedEstimate = estimateEffortAdjustedPerformance(
        weight,
        reps,
        rpe,
        config,
      );

      const representative: RepresentativeSet = {
        workoutId: workout.id,
        workoutExerciseId: entry.id,
        setId: set.id,

        finishedAt,
        workoutFinishedAt: workout.finishedAt,

        weight,
        reps,
        rpe,

        rawEstimate,
        adjustedEstimate,
      };

      if (
        result.rawRepresentative === null ||
        rawEstimate > result.rawRepresentative.rawEstimate
      ) {
        result.rawRepresentative = representative;
      }

      if (adjustedEstimate !== null) {
        adjustedCandidates.push(representative);
      }
    }

    for (const candidate of adjustedCandidates) {
      if (
        !result.rawRepresentative ||
        candidate.rawEstimate <
          result.rawRepresentative.rawEstimate *
            config.adjustedRepresentativeFloor
      ) {
        continue;
      }

      if (
        candidate.adjustedEstimate !== null &&
        (result.adjustedRepresentative?.adjustedEstimate == null ||
          candidate.adjustedEstimate >
            result.adjustedRepresentative.adjustedEstimate)
      ) {
        result.adjustedRepresentative = candidate;
      }
    }

    if (
      result.validSetCount > 0 &&
      result.rpeSetCount / result.validSetCount >= config.rpeCoverage
    ) {
      result.typicalRpe = median(rpes);
    }

    result.issues = [...new Set(result.issues)];

    sessions.push(result);
  }

  return sessions.sort(
    (a, b) =>
      a.finishedAt - b.finishedAt || a.workoutId.localeCompare(b.workoutId),
  );
}
