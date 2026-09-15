import { type ProgressConfig, progressConfig } from "../progress.config";
import type { LiftSessionMetrics } from "../sessions/progress.sessions.types";
import { deriveLiftTrends } from "../trends/progress.trends";
import type { LiftTrendMetrics } from "../trends/progress.trends.types";
import { deriveDailyPerformance } from "../trends/progress.trends.utils";

import type { LiftStatus, StatusAssessment } from "./progress.status.types";
import { candidateStatus, learningReason } from "./progress.status.utils";

export function assessLiftStatus(
  sessions: readonly LiftSessionMetrics[],
  trends: LiftTrendMetrics,
  analysisTime: number,
  config: ProgressConfig = progressConfig,
): StatusAssessment {
  const reason = learningReason(sessions, trends, analysisTime, config);

  if (reason) return { value: "learning", reason, confirmed: false };

  let status: LiftStatus = "learning";
  let pending: LiftStatus | null = null;
  let confirmations = 0;
  let lastProgressDay = -Infinity;
  let previousBasis = trends.basis;
  let confirmed = false;

  for (const checkpoint of deriveDailyPerformance(sessions)) {
    const prefix = sessions.filter(
      (session) => session.finishedAt <= checkpoint.finishedAt,
    );
    const current = deriveLiftTrends(prefix, checkpoint.finishedAt, config);

    if (learningReason(prefix, current, checkpoint.finishedAt, config)) {
      status = "learning";
      pending = null;
      confirmations = 0;
      confirmed = false;
      lastProgressDay = -Infinity;
      continue;
    }

    if (previousBasis !== current.basis) {
      pending = null;
      confirmations = 0;
      status = "stable";
      confirmed = false;
      lastProgressDay = -Infinity;
    }

    previousBasis = current.basis;

    const candidate = candidateStatus(
      current,
      checkpoint.day - lastProgressDay <= config.contextDays,
      config,
    );

    if (status === "learning") {
      status = "stable";
    }

    if (pending === candidate) {
      confirmations++;
    } else {
      pending = candidate;
      confirmations = 1;
    }

    const delta =
      current.performance.change.status === "available"
        ? current.performance.change.value
        : 0;
    const retain =
      candidate === "stable" &&
      ((status === "progressing" &&
        delta > config.progressExitPercent + config.comparisonEpsilon) ||
        (status === "regressing" &&
          delta < config.regressionExitPercent - config.comparisonEpsilon) ||
        (status === "plateaued" &&
          Math.abs(delta) <=
            config.plateauExitPercent + config.comparisonEpsilon));

    if (confirmations >= config.confirmationDays && !retain) {
      status = candidate;
      confirmed = true;
    }

    if (status === "progressing") lastProgressDay = checkpoint.day;
  }

  return {
    value: status,
    reason: confirmed ? "confirmed_trend" : "confirming_change",
    confirmed,
  };
}
