import { validTimestamp } from "@/shared/utils/localCalendar";

import type { SetRecord, SourceSet } from "./progress.sessions.types";

export function orderedIndex(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function isValidTrainingSet(
  source: SourceSet,
  finishedAt: number,
): source is SourceSet & {
  set: SetRecord & {
    weight: number;
    reps: number;
    finishedAt: number;
  };
} {
  const { set, workout } = source;

  return (
    validTimestamp(set.finishedAt) &&
    set.finishedAt >= workout.startedAt &&
    set.finishedAt <= finishedAt &&
    set.weight !== null &&
    Number.isFinite(set.weight) &&
    set.weight > 0 &&
    set.reps !== null &&
    Number.isSafeInteger(set.reps) &&
    set.reps > 0 &&
    Number.isFinite(set.weight * set.reps) &&
    ["working", "top", "backoff"].includes(set.type)
  );
}
