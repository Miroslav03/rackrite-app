import type { EvidenceAssessment } from "../evidence/progress.evidence.types";
import { type ProgressConfig, progressConfig } from "../progress.config";
import type { LiftSessionMetrics } from "../sessions/progress.sessions.types";
import type { StatusAssessment } from "../status/progress.status.types";
import type { LiftTrendMetrics } from "../trends/progress.trends.types";

import type {
  DiagnosisReason,
  LiftDiagnosis,
} from "./progress.diagnosis.types";
import {
  compareProductiveWorkload,
  uncertain,
} from "./progress.diagnosis.utils";

export function diagnoseLift(
  status: StatusAssessment,
  evidence: EvidenceAssessment,
  trends: LiftTrendMetrics,
  sessions: readonly LiftSessionMetrics[],
  config: ProgressConfig = progressConfig,
): LiftDiagnosis {
  if (
    [
      "no_history",
      "no_performance",
      "ambiguous_identity",
      "conflicting_signals",
    ].includes(status.reason)
  )
    return uncertain;

  if (
    (trends.gapReset && status.value === "learning") ||
    status.reason === "stale_history" ||
    trends.maxGapDays > config.regularGapDays ||
    trends.missingCompleteWeeks >= config.missingWeeks
  ) {
    return {
      kind: "inconsistent_training",
      evidence: "moderate",
      reasons: ["training_gaps"],
      referenceWindow: null,
    };
  }

  if (status.value === "learning") return uncertain;

  if (status.value === "progressing" || status.value === "stable")
    return {
      kind: "none",
      evidence: evidence.level,
      reasons: status.value === "progressing" ? ["productive_training"] : [],
      referenceWindow: null,
    };

  if (evidence.level === "weak") return uncertain;

  const delta =
    trends.performance.change.status === "available"
      ? trends.performance.change.value
      : null;

  if (
    delta === null ||
    delta >= config.progressPercent - config.comparisonEpsilon
  )
    return uncertain;

  const productive = compareProductiveWorkload(trends, sessions, config);
  const effortChange = productive
    ? productive.rpeChange
    : trends.effort.change.status === "available"
      ? trends.effort.change.value
      : null;
  const hardSetsChange = productive?.hardSetsChange ?? trends.hardSetsChange;
  const effortRise =
    trends.rpeAdequate &&
    effortChange !== null &&
    effortChange >= config.fatigueRpeRise;

  if (
    effortRise &&
    hardSetsChange.status === "available" &&
    hardSetsChange.value >= config.hardSetsRisePercent
  ) {
    const fatigueReasons: DiagnosisReason[] = [
      "rising_effort",
      "rising_hard_sets",
    ];

    if ((trends.highEffortShareChange ?? 0) >= config.highEffortShareRise) {
      fatigueReasons.push("frequent_high_effort");
    }

    if (
      trends.frequencyChange.status === "available" &&
      trends.frequencyChange.value >= config.frequencyChangePercent
    ) {
      fatigueReasons.push("rising_frequency");
    }

    return {
      kind: "fatigue",
      evidence: "moderate",
      reasons: fatigueReasons,
      referenceWindow: productive?.window ?? trends.workloadWindow,
    };
  }

  if (
    trends.rpeAdequate &&
    (trends.recentHighEffortShare ?? 0) >= config.highEffortShare &&
    trends.highEffortDays >= config.highEffortDays
  ) {
    return {
      kind: "excessive_intensity",
      evidence: "moderate",
      reasons: ["frequent_high_effort"],
      referenceWindow: trends.performance.window,
    };
  }

  if (
    Math.abs(delta) > config.neutralPercent + config.comparisonEpsilon ||
    !trends.rpeAdequate ||
    effortRise ||
    trends.recentWeeklyHardSets === null ||
    trends.recentWeeklyFrequency === null
  )
    return uncertain;

  if (!productive) return uncertain;
  if (
    productive.hardSetsChange.status === "available" &&
    productive.hardSetsChange.value <= config.hardSetsDropPercent
  )
    return {
      kind: "insufficient_stimulus",
      evidence: "moderate",
      reasons: ["lower_historical_workload"],
      referenceWindow: productive.window,
    };
  if (
    productive.frequencyChange.status === "available" &&
    productive.frequencyChange.value <= -config.frequencyChangePercent
  )
    return {
      kind: "insufficient_stimulus",
      evidence: "moderate",
      reasons: ["lower_historical_frequency"],
      referenceWindow: productive.window,
    };
  return uncertain;
}
