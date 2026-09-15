import type { ProgressOverview } from "@/domain/progress/analysis/progress.analysis.types";
import type { BenchmarkTarget } from "@/domain/progress/benchmark/progress.benchmark.types";
import type { DiagnosisKind } from "@/domain/progress/diagnosis/progress.diagnosis.types";
import type { EvidenceLevel } from "@/domain/progress/evidence/progress.evidence.types";
import type { UnavailableReason } from "@/domain/progress/measurements/progress.measurements.types";
import type { RecommendationKind } from "@/domain/progress/recommendation/progress.recommendation.types";
import type {
  LiftStatus,
  StatusReason,
} from "@/domain/progress/status/progress.status.types";
import type { TrendMetric } from "@/domain/progress/trends/progress.trends.types";

import {
  available,
  earlyOverview,
  emptyOverview,
  previewOverview,
  recordedOverview,
  withTrends,
} from "./progressStory.fixtures";

/** One named, deterministic visual example; all three lifts are available in each preview. */
export type ProgressStoryScenario = {
  id: string; // Stable key used by stories and to reset local chart/sheet interactions.
  group: string; // Catalog section describing the card or behavior being inspected.
  title: string; // Human-readable scenario name.
  description: string; // What to look for when inspecting the real cards.
  overview: ProgressOverview; // In-memory analysis snapshot; never written to SQLite.
  metric?: TrendMetric; // Initial chart tab, which remains editable in the preview.
  refresh?: "pending" | "error" | "retrying"; // Simulated refresh state; no repository request is made.
};

// Exhaustive records make newly added domain categories require a corresponding preview.
const statuses: Record<
  LiftStatus,
  { delta: number; action: RecommendationKind }
> = {
  learning: { delta: 0, action: "gather_evidence" },
  progressing: { delta: 4, action: "continue_approach" },
  stable: { delta: 0, action: "continue_approach" },
  stalling: { delta: -2, action: "monitor" },
  plateaued: { delta: 0, action: "gather_evidence" },
  regressing: { delta: -4, action: "reassess" },
};
const evidenceLevels: Record<EvidenceLevel, number> = {
  weak: 1,
  moderate: 3,
  strong: 5,
};
const learningReasons: Record<StatusReason, string> = {
  no_history: "No history",
  no_performance: "No eligible sets",
  insufficient_history: "Too few comparable days",
  stale_history: "Stale history",
  training_gap: "Restart after a gap",
  ambiguous_identity: "Identity conflict",
  conflicting_signals: "Conflicting signals",
  confirming_change: "Waiting for confirmation",
  confirmed_trend: "Learning fallback copy",
};
const diagnoses: Record<DiagnosisKind, RecommendationKind> = {
  none: "continue_approach",
  fatigue: "reduce_stress",
  excessive_intensity: "reduce_stress",
  insufficient_stimulus: "review_stimulus",
  inconsistent_training: "restore_consistency",
  insufficient_evidence: "gather_evidence",
};
const recommendations: Record<RecommendationKind, LiftStatus> = {
  continue_approach: "progressing",
  monitor: "stalling",
  reduce_stress: "plateaued",
  review_stimulus: "plateaued",
  restore_consistency: "learning",
  gather_evidence: "learning",
  reassess: "regressing",
};
const unavailableReasons: Record<UnavailableReason, string> = {
  no_history: "No history",
  no_performance: "No eligible sets",
  insufficient_history: "Insufficient history",
  missing_rpe: "Missing RPE",
  partial_rpe: "Partial RPE",
  invalid_baseline: "Invalid baseline",
  incomplete_period: "Incomplete weeks",
};

function entries<K extends string, V>(record: Record<K, V>): [K, V][] {
  // Object.keys returns the own keys of the closed scenario records above.
  return (Object.keys(record) as K[]).map((key) => [key, record[key]]);
}

const statusScenarios: ProgressStoryScenario[] = entries(statuses).map(
  ([value, { delta, action }]) => ({
    id: `status-${value}`,
    group: "Lift status",
    title: value,
    description:
      "Inspect the status label, accent, summary and six-week change. Switch lifts to check all titles.",
    overview:
      value === "learning"
        ? emptyOverview
        : previewOverview((a) => ({
            status: { value, reason: "confirmed_trend", confirmed: true },
            recommendation: { kind: action, reasons: [], benchmark: null },
            diagnosis: {
              kind: "none",
              evidence: "weak",
              reasons: [],
              referenceWindow: null,
            },
            trends: {
              ...a.trends,
              performance: {
                ...a.trends.performance,
                change: available(delta),
              },
            },
          })),
  }),
);

const benchmarkCases: Record<
  string,
  {
    intent: BenchmarkTarget["intent"];
    weight: number;
    rpe: BenchmarkTarget["rpe"];
  }
> = {
  "Progress with RPE": {
    intent: "progress",
    weight: 102.5,
    rpe: { min: 7, max: 8 },
  },
  "Repeat with RPE": { intent: "repeat", weight: 100, rpe: { min: 7, max: 8 } },
  "Repeat off-grid without RPE": {
    intent: "repeat",
    weight: 101.25,
    rpe: null,
  },
  "Reduce stress with RPE": {
    intent: "reduce_stress",
    weight: 92.5,
    rpe: { min: 7, max: 8 },
  },
  "Reduce stress without RPE": {
    intent: "reduce_stress",
    weight: 95,
    rpe: null,
  },
};
const benchmarkScenarios: ProgressStoryScenario[] = Object.entries(
  benchmarkCases,
).map(([title, target]) => ({
  id: `benchmark-${title.toLowerCase().replaceAll(" ", "-")}`,
  group: "Benchmarks",
  title,
  description:
    "Inspect target load, repetitions, optional RPE and explanation. Loads in this visual fixture are intentionally identical across lift tabs.",
  overview: previewOverview((a) => ({
    status: {
      value:
        target.intent === "progress"
          ? "progressing"
          : target.intent === "reduce_stress"
            ? "regressing"
            : "stable",
      reason: "confirmed_trend",
      confirmed: true,
    },
    trends: {
      ...a.trends,
      basis: target.rpe ? a.trends.basis : "load_reps",
      rpeChange: target.rpe
        ? a.trends.rpeChange
        : { status: "unavailable", reason: "missing_rpe" },
      performance: {
        ...a.trends.performance,
        change: available(
          target.intent === "progress"
            ? 4
            : target.intent === "reduce_stress"
              ? -4
              : 0,
        ),
      },
    },
    recommendation: {
      kind:
        target.intent === "reduce_stress"
          ? "reduce_stress"
          : "continue_approach",
      reasons: [],
      benchmark: {
        ...target,
        reps: 3,
        sources: a.sessions
          .slice(-3)
          .flatMap((s) => (s.rawRepresentative ? [s.rawRepresentative] : [])),
        reason:
          target.intent === "progress"
            ? "supported_progression"
            : target.intent === "reduce_stress"
              ? "lower_stress"
              : target.rpe
                ? "comparable_repeat"
                : "effort_headroom_unknown",
      },
    },
  })),
}));

const chartCases: Record<string, readonly (number | null)[]> = {
  Empty: [null, null, null, null, null, null, null, null],
  "Single point": [null, null, null, null, null, null, null, 120],
  "Missing weeks": [100, null, 105, null, 110, 115, null, 120],
  "Equal values": [100, 100, 100, 100, 100, 100, 100, 100],
  "Zero volume": [0, 0, 0, 0, 0, 0, 0, 0],
  "Extreme value": [100, 101, 99, 100, 1000000, 102, 98, 100],
  Rising: [100, 102, 104, 106, 108, 110, 112, 114],
  Falling: [114, 112, 110, 108, 106, 104, 102, 100],
};

export const progressStoryScenarios: readonly ProgressStoryScenario[] = [
  {
    id: "recorded",
    group: "Overview",
    title: "Derived sample history",
    description:
      "All values come from the real analyzer using 16 synthetic workouts per lift. Other catalog entries use explicit visual overrides, not classifier predictions.",
    overview: recordedOverview,
  },
  {
    id: "empty",
    group: "Overview",
    title: "Empty history",
    description:
      "All four cards remain present without sessions, estimates or benchmarks.",
    overview: emptyOverview,
  },
  {
    id: "early",
    group: "Overview",
    title: "Early estimate",
    description:
      "One workout per lift: inspect the early-history note, missing comparison and E1RM point.",
    overview: earlyOverview,
    metric: "e1rm",
  },
  ...statusScenarios,
  ...entries(evidenceLevels).map(([level, supportingDays]) => ({
    id: `evidence-${level}`,
    group: "Evidence",
    title: `${level} status evidence`,
    description:
      "Status evidence and supporting-day text; diagnosis evidence is separate.",
    overview: previewOverview((a) => ({
      evidence: { ...a.evidence, level, supportingDays, consideredDays: 5 },
    })),
  })),
  ...entries(learningReasons).map(([reason, title]) => ({
    id: `learning-${reason}`,
    group: "Learning explanations",
    title,
    description:
      "Inspect the learning explanation. These are isolated copy fixtures.",
    overview: previewOverview(
      () => ({ status: { value: "learning", reason, confirmed: false } }),
      emptyOverview,
    ),
  })),
  ...entries(diagnoses).map(([kind, action]) => ({
    id: `diagnosis-${kind}`,
    group: "Diagnosis",
    title: kind.replaceAll("_", " "),
    description:
      "Inspect the optional diagnosis section, its separate evidence label and recommendation.",
    overview: previewOverview((a) => ({
      trends: {
        ...a.trends,
        rpeChange: available(
          kind === "fatigue" || kind === "excessive_intensity" ? 1 : 0,
        ),
        volumeChange: available(
          kind === "fatigue" ? 25 : kind === "insufficient_stimulus" ? -25 : 0,
        ),
      },
      status: {
        value:
          kind === "none"
            ? "stable"
            : kind === "inconsistent_training"
              ? "learning"
              : "plateaued",
        reason:
          kind === "inconsistent_training" ? "training_gap" : "confirmed_trend",
        confirmed: kind !== "inconsistent_training",
      },
      diagnosis: {
        kind,
        evidence:
          kind === "insufficient_evidence" || kind === "none"
            ? "weak"
            : "moderate",
        reasons: [],
        referenceWindow: null,
      },
      recommendation: { kind: action, reasons: [], benchmark: null },
    })),
  })),
  ...entries(recommendations).map(([kind, value]) => ({
    id: `action-${kind}`,
    group: "Recommendations",
    title: kind.replaceAll("_", " "),
    description:
      "Each recommendation without a target. No empty benchmark cassette should remain.",
    overview: previewOverview(() => ({
      status: {
        value,
        reason:
          value === "learning" ? "insufficient_history" : "confirmed_trend",
        confirmed: value !== "learning",
      },
      recommendation: { kind, reasons: [], benchmark: null },
    })),
  })),
  ...benchmarkScenarios,
  ...entries(unavailableReasons).map(([reason, title]) => ({
    id: `missing-${reason}`,
    group: "Unavailable measurements",
    title,
    description:
      "Four unavailable rows retain their labels and reasons, with no fabricated zero values.",
    overview: withTrends((t) => ({
      performance: {
        ...t.performance,
        change: { status: "unavailable", reason },
      },
      raw: { ...t.raw, change: { status: "unavailable", reason } },
      rpeChange: { status: "unavailable", reason },
      volumeChange: { status: "unavailable", reason },
    })),
  })),
  ...[-1, 0, 1].map((direction) => ({
    id: `bars-${direction}`,
    group: "Evidence bars",
    title:
      direction === 0
        ? "Zero / negative zero"
        : direction > 0
          ? "Positive and clamped"
          : "Negative and clamped",
    description:
      "Performance ±15%, E1RM ±5%, RPE ±3 points, volume ±75%. Fills clamp at ±10%, ±2 and ±50%; effort and volume remain neutral.",
    overview: withTrends((t) => ({
      performance: { ...t.performance, change: available(direction * 15) },
      raw: { ...t.raw, change: available(direction * 5) },
      rpeChange: available(direction ? direction * 3 : -0.001),
      volumeChange: available(direction * 75),
    })),
  })),
  ...Object.entries(chartCases).map(
    ([title, values]): ProgressStoryScenario => ({
      id: `chart-${title.toLowerCase().replaceAll(" ", "-")}`,
      group: "Charts",
      title,
      metric: title === "Zero volume" ? "volume" : "performance",
      description:
        "Switch all three chart metrics; press bars for dates and values. W8 is partial. Heights use a zero baseline.",
      overview: withTrends((t) => ({
        basis: "load_reps",
        performance: {
          ...t.performance,
          baseline: 100,
          change:
            title === "Empty" || title === "Single point"
              ? { status: "unavailable", reason: "insufficient_history" }
              : available(
                  title === "Rising" ? 4 : title === "Falling" ? -4 : 0,
                ),
        },
        weekly: t.weekly.map((w, i) => ({
          ...w,
          raw: values[i],
          adjusted: values[i],
          volume: values[i] === null ? null : values[i] * 100,
        })),
      })),
    }),
  ),
  {
    id: "adjusted",
    group: "Charts",
    title: "Adjusted with missing points",
    description:
      "Performance leaves unrecorded adjusted weeks empty. E1RM still shows raw values for those weeks.",
    overview: withTrends((t) => ({
      basis: "effort_adjusted",
      weekly: t.weekly.map((w, i) => ({
        ...w,
        adjusted: i % 2 ? null : w.adjusted,
      })),
    })),
  },
  {
    id: "stale",
    group: "Refresh",
    title: "Outdated snapshot → retry",
    description:
      "The fixture contains a benchmark. A refresh error hides it; press Try Again or pull to refresh to restore it.",
    overview: benchmarkScenarios[0].overview,
    refresh: "error",
  },
  {
    id: "refresh-pending",
    group: "Refresh",
    title: "Refreshing with a current snapshot",
    description:
      "The spinner is visible and the current benchmark remains available. Complete the simulated refresh using the button.",
    overview: benchmarkScenarios[0].overview,
    refresh: "pending",
  },
  {
    id: "refresh-retrying",
    group: "Refresh",
    title: "Retrying an outdated snapshot",
    description:
      "Both the spinner and outdated warning remain visible. The benchmark stays hidden until you complete the simulated refresh.",
    overview: benchmarkScenarios[0].overview,
    refresh: "retrying",
  },
  {
    id: "chart-no-baseline",
    group: "Charts",
    title: "Missing comparison baseline",
    description:
      "Performance has no valid baseline, so its chart is empty. Switch to E1RM to see available early estimates.",
    overview: withTrends((t) => ({
      performance: {
        ...t.performance,
        baseline: null,
        change: { status: "unavailable", reason: "invalid_baseline" },
      },
    })),
  },
];
