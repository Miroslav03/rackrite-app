import type { LiftFamily } from "@/domain/domain.types";

import { generateBenchmarkTarget } from "../benchmark/progress.benchmark";
import { diagnoseLift } from "../diagnosis/progress.diagnosis";
import { assessEvidence } from "../evidence/progress.evidence";
import { createEvidenceFacts } from "../evidence/progress.evidence.utils";
import type { CompetitionLiftExposure } from "../history/progress.history.types";
import { available, unavailable } from "../measurements/progress.measurements";
import { median } from "../measurements/progress.measurements.utils";
import type { ProgressConfig } from "../progress.config";
import { recommendLiftAction } from "../recommendation/progress.recommendation";
import { deriveLiftSessions } from "../sessions/progress.sessions";
import { assessLiftStatus } from "../status/progress.status";
import { deriveLiftTrends } from "../trends/progress.trends";

import type { LiftAnalysis, LiftAnalysisCore } from "./progress.analysis.types";

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

  const estimate = median(
    trends.contextDays.slice(-config.supportWindow).map((day) => day.raw),
  );

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
      estimate === null ? unavailable("no_performance") : available(estimate),
    analyzedSessionCount: trends.contextDays.reduce(
      (sum, day) => sum + day.sessions.length,
      0,
    ),
  };

  return {
    ...core,
    recommendation: {
      kind,
      reasons: [status.reason, ...diagnosis.reasons],
      benchmark: generateBenchmarkTarget(core, kind, config),
    },
  };
}
