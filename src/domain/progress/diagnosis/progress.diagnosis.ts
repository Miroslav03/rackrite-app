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

  const effortRise =
    trends.rpeAdequate &&
    trends.rpeChange.status === "available" &&
    trends.rpeChange.value >= config.fatigueRpeRise;

  if (
    effortRise &&
    trends.volumeChange.status === "available" &&
    trends.volumeChange.value >= config.fatigueVolumeRise
  ) {
    const fatigueReasons: DiagnosisReason[] = [
      "rising_effort",
      "rising_volume",
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
      referenceWindow: trends.workloadWindow,
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
    trends.recentWeeklyVolume === null ||
    trends.recentWeeklyFrequency === null
  )
    return uncertain;

  return compareProductiveWorkload(trends, sessions, config);
}
