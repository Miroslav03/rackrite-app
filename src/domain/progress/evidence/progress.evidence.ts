import { type ProgressConfig, progressConfig } from "../progress.config";
import type { LiftSessionMetrics } from "../sessions/progress.sessions.types";
import type { StatusAssessment } from "../status/progress.status.types";
import { supportingDayCount } from "../status/progress.status.utils";
import type { LiftTrendMetrics } from "../trends/progress.trends.types";

import type { EvidenceAssessment } from "./progress.evidence.types";
import { calculateValidRecordShare } from "./progress.evidence.utils";

export function assessEvidence(
  status: StatusAssessment,
  trends: LiftTrendMetrics,
  sessions: readonly LiftSessionMetrics[],
  config: ProgressConfig = progressConfig,
): EvidenceAssessment {
  const consideredDays = Math.min(
    config.strongSupportWindow,
    trends.days.length,
  );
  const supportingDays = supportingDayCount(
    trends,
    status.value,
    consideredDays,
    config,
  );

  const validShare = calculateValidRecordShare(sessions, trends);

  if (trends.conflictingSignals)
    return {
      level: "weak",
      supportingDays,
      consideredDays,
      reasons: ["conflicting_signals"],
    };

  if (status.value === "learning" || !status.confirmed)
    return {
      level: "weak",
      supportingDays,
      consideredDays,
      reasons: ["limited_history"],
    };

  if (validShare < config.minimumValidShare)
    return {
      level: "weak",
      supportingDays,
      consideredDays,
      reasons: ["invalid_records"],
    };

  if (
    supportingDayCount(trends, status.value, config.supportWindow, config) <
    config.supportDays
  )
    return {
      level: "weak",
      supportingDays,
      consideredDays,
      reasons: ["limited_history"],
    };

  const span = trends.contextDays.length
    ? trends.contextDays[trends.contextDays.length - 1].day -
      trends.contextDays[0].day
    : 0;
  const strong =
    trends.contextDays.length >= config.strongDays && // At least 12 performance days in the selected eight-week context.
    span >= config.strongSpanDays && // Those days span at least 42 days.
    trends.maxGapDays <= config.regularGapDays && // No performance-day gap greater than 14 days.
    validShare >= config.strongValidShare && // At least 90% valid records.
    supportingDays >= config.strongSupportDays && // At least four of the latest five days support the status.
    !trends.repetitionShift; // No substantial representative-repetition shift.

  return {
    level: strong ? "strong" : "moderate",
    supportingDays,
    consideredDays,
    reasons: trends.repetitionShift
      ? ["repetition_shift"]
      : ["consistent_pattern"],
  };
}
