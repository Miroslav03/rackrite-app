import type { LiftFamily } from "@/domain/domain.types";

import { generateBenchmarkTarget } from "../benchmark/progress.benchmark";
import { diagnoseLift } from "../diagnosis/progress.diagnosis";
import { assessEvidence } from "../evidence/progress.evidence";
import { createEvidenceFacts } from "../evidence/progress.evidence.utils";
import type { CompetitionLiftExposure } from "../history/progress.history.types";
import { available, unavailable } from "../measurements/progress.measurements";
import type { ProgressConfig } from "../progress.config";
import { recommendLiftAction } from "../recommendation/progress.recommendation";
import { deriveLiftSessions } from "../sessions/progress.sessions";
import type { LiftSessionMetrics } from "../sessions/progress.sessions.types";
import { assessLiftStatus } from "../status/progress.status";
import { deriveLiftTrends } from "../trends/progress.trends";
import type { EstimateBasis } from "../trends/progress.trends.types";
import { selectComparisonHistory } from "../trends/progress.trends.utils";

import type { LiftAnalysis, LiftAnalysisCore } from "./progress.analysis.types";

function selectCurrentEstimatedMax(
  sessions: readonly LiftSessionMetrics[],
  analysisTime: number,
  config: ProgressConfig,
): { value: number; basis: EstimateBasis } | undefined {
  // Preserve recent demonstrated capacity when the next workout is lighter.
  return selectComparisonHistory(sessions, analysisTime, config)
    .contextDays.slice(-config.supportWindow)
    .flatMap((day) => day.sessions)
    .flatMap<{ value: number; basis: EstimateBasis }>((session) => {
      const raw = session.rawRepresentative?.rawEstimate;
      const adjusted = session.adjustedRepresentative?.adjustedEstimate;

      if (raw === undefined) return [];

      if (adjusted === null || adjusted === undefined || adjusted < raw) {
        return [{ value: raw, basis: "load_reps" }];
      }

      return [{ value: adjusted, basis: "effort_adjusted" }];
    })
    .sort((a, b) => b.value - a.value)[0];
}

export function analyzeLift(
  history: readonly CompetitionLiftExposure[],
  family: LiftFamily,
  analysisTime: number,
  config: ProgressConfig,
): LiftAnalysis {
  const sessions = deriveLiftSessions(history, family, analysisTime, config);
  const trends = deriveLiftTrends(sessions, analysisTime, config);
  const status = assessLiftStatus(sessions, trends, analysisTime, config);
  const evidence = assessEvidence(status, trends, sessions, config);
  const diagnosis = diagnoseLift(status, evidence, trends, sessions, config);

  const estimate = selectCurrentEstimatedMax(sessions, analysisTime, config);

  const facts = createEvidenceFacts(sessions, trends);
  const kind = recommendLiftAction(status, evidence, diagnosis);

  const core: LiftAnalysisCore = {
    family,
    analysisTime,
    sessions,
    trends,
    status,
    evidence,
    diagnosis,
    facts,
    currentEstimatedMax:
      estimate === undefined
        ? unavailable("no_performance")
        : available(estimate.value),
    currentEstimatedMaxBasis: estimate?.basis ?? null,
    analyzedSessionCount: trends.contextDays.reduce(
      (sum, day) => sum + day.sessions.length,
      0,
    ),
  };

  const benchmark = generateBenchmarkTarget(core, kind, config);

  return {
    ...core,
    recommendation: {
      kind,
      reasons: [status.reason, ...diagnosis.reasons],
      benchmark: benchmark.status === "available" ? benchmark.target : null,
      benchmarkUnavailableReason:
        benchmark.status === "unavailable" ? benchmark.reason : null,
    },
  };
}
