import type { LiftFamily } from "@/domain/domain.types";
import type { ProgressOverview } from "@/domain/progress/analysis/progress.analysis.types";
import type { TrendMetric } from "@/domain/progress/trends/progress.trends.types";

type Selection = { selectedLift: LiftFamily; metric: TrendMetric };

type RefreshState =
  | { status: "idle" }
  | { status: "pending"; previousError: Error | null }
  | { status: "error"; error: Error };

export type ProgressState = Selection &
  (
    | { status: "loading" }
    | { status: "loadError"; error: Error }
    | { status: "ready"; overview: ProgressOverview; refresh: RefreshState }
  );

export type ProgressAction =
  | { type: "refreshStarted" }
  | { type: "refreshSucceeded"; overview: ProgressOverview }
  | { type: "refreshFailed"; error: Error }
  | { type: "interrupted" }
  | { type: "liftSelected"; family: LiftFamily }
  | { type: "metricSelected"; metric: TrendMetric };
