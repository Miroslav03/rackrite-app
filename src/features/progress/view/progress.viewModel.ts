import type { LiftFamily } from "@/domain/domain.types";
import type {
  LiftAnalysis,
  ProgressOverview,
} from "@/domain/progress/analysis/progress.analysis.types";
import type { DiagnosisKind } from "@/domain/progress/diagnosis/progress.diagnosis.types";
import type {
  Measurement,
  UnavailableReason,
} from "@/domain/progress/measurements/progress.measurements.types";
import type { RecommendationKind } from "@/domain/progress/recommendation/progress.recommendation.types";
import type {
  LiftStatus,
  StatusReason,
} from "@/domain/progress/status/progress.status.types";
import type { TrendMetric } from "@/domain/progress/trends/progress.trends.types";

import type { BarChartPoint } from "@/shared/components/charts/BarChart";
import { colors } from "@/shared/theme/tokens";

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const load = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const date = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export const liftLabels: Record<LiftFamily, string> = {
  squat: "Squat",
  bench: "Bench",
  deadlift: "Deadlift",
};

const titles: Record<LiftFamily, string> = {
  squat: "SQUAT",
  bench: "BENCH PRESS",
  deadlift: "DEADLIFT",
};

const appearances: Record<LiftStatus, { color: string }> = {
  learning: { color: colors.muted },
  progressing: { color: colors.success },
  stable: { color: colors.primarySoft },
  stalling: { color: colors.warning },
  plateaued: { color: colors.warning },
  regressing: { color: colors.errorBorder },
};

const missing: Record<UnavailableReason, string> = {
  no_history: "No recent sessions",
  no_performance: "No eligible performance sets",
  insufficient_history: "More comparable sessions needed",
  missing_rpe: "RPE not recorded",
  partial_rpe: "Partial RPE history",
  invalid_baseline: "No valid comparison baseline",
  incomplete_period: "More complete weeks needed",
};

const learning: Record<StatusReason, string> = {
  no_history: "No recent completed competition sessions yet.",
  no_performance:
    "Your recorded sessions do not yet contain eligible competition performance sets.",
  insufficient_history:
    "RackRite needs more comparable sessions across several weeks.",
  stale_history:
    "Your last eligible performance is over three weeks old. Log recent sessions to rebuild the picture.",
  training_gap: "You're rebuilding comparable history after a training gap.",
  ambiguous_identity:
    "Competition exercise identities conflict in this history. RackRite cannot reliably combine them.",
  conflicting_signals:
    "Load and effort signals disagree. More comparable sessions will help clarify the trend.",
  confirming_change: "RackRite is waiting for repeated evidence.",
  confirmed_trend: "RackRite is learning your performance.",
};

const diagnoses: Record<DiagnosisKind, { title: string; description: string }> =
  {
    none: { title: "", description: "" },
    fatigue: {
      title: "POSSIBLE ACCUMULATED FATIGUE",
      description:
        "This pattern is consistent with accumulated fatigue: effort and recorded competition workload have risen while performance has flattened or declined.",
    },
    excessive_intensity: {
      title: "FREQUENT HIGH-EFFORT WORK",
      description:
        "Repeated RPE 9–10 work accompanies flat or declining performance. A lower-stress exposure may help clarify the pattern.",
    },
    insufficient_stimulus: {
      title: "LOWER RECORDED TRAINING DEMAND",
      description:
        "Competition workload or frequency is lower than in your most recent comparable productive period.",
    },
    inconsistent_training: {
      title: "GAPS IN RECORDED EXPOSURES",
      description:
        "Gaps in competition-lift exposures limit a continuous performance comparison.",
    },
    insufficient_evidence: {
      title: "CAUSE NOT YET CLEAR",
      description:
        "RackRite does not yet have enough evidence to identify a likely cause.",
    },
  };

const recommendations: Record<
  RecommendationKind,
  { title: string; description: string }
> = {
  continue_approach: {
    title: "KEEP YOUR CURRENT APPROACH",
    description:
      "Your recorded training supports maintaining your current approach. No meaningful adjustment is recommended.",
  },
  monitor: {
    title: "MONITOR BEFORE CHANGING YOUR PROGRAM",
    description:
      "Watch your next two comparable competition sessions before making a major adjustment.",
  },
  reduce_stress: {
    title: "CONSIDER LOWERING TRAINING STRESS",
    description:
      "If your goal is to improve this lift, consider temporarily reducing hard competition work and reassessing with a lower-stress exposure.",
  },
  review_stimulus: {
    title: "REVIEW YOUR RECENT WORKLOAD",
    description:
      "If your goal is to improve this lift, consider gradually returning toward previously productive workload. Change one variable at a time.",
  },
  restore_consistency: {
    title: "REBUILD CONSISTENT EXPOSURES",
    description:
      "Keep logging comparable competition-lift sessions so RackRite can assess a continuous training period.",
  },
  gather_evidence: {
    title: "KEEP LOGGING COMPARABLE SESSIONS",
    description:
      "Gather more comparable training history before making a major change. RPE is optional.",
  },
  reassess: {
    title: "REASSESS WITH A CONSERVATIVE BENCHMARK",
    description:
      "Performance has repeatedly declined. Review recent training and use a lower-stress comparable exposure before increasing demands.",
  },
};

export function formatChange(value: number, unit = "%"): string {
  const rounded = Math.abs(value) < 0.05 ? 0 : value;

  return `${rounded > 0 ? "+" : ""}${number.format(rounded)}${unit}`;
}

export type EvidenceRowViewModel = {
  id: string;
  label: string;
  value: string;
  note: string | null;
  direction: string;
  color: string;
  fraction: number | null;
};

function evidenceRow(
  id: string,
  label: string,
  measurement: Measurement,
  scale: number,
  neutral = false,
  unit = "%",
): EvidenceRowViewModel {
  if (measurement.status === "unavailable")
    return {
      id,
      label,
      value: "—",
      note: missing[measurement.reason],
      direction: "",
      color: colors.muted,
      fraction: null,
    };

  const value = measurement.value;

  return {
    id,
    label,
    value: formatChange(value, unit),
    note: null,
    direction: Math.abs(value) < 0.05 ? "−" : value > 0 ? "↑" : "↓",
    color: neutral
      ? colors.primarySoft
      : value > 0
        ? colors.success
        : value < 0
          ? colors.error
          : colors.muted,
    fraction: Math.max(-1, Math.min(1, value / scale)),
  };
}

function statusSummary(analysis: LiftAnalysis): string {
  const name = liftLabels[analysis.family].toLowerCase();

  switch (analysis.status.value) {
    case "learning":
      return learning[analysis.status.reason];
    case "progressing":
      return `Your ${name} performance appears to be improving consistently.`;
    case "stable":
      return `Your recent ${name} performance is holding steady. Maintaining strength can be intentional.`;
    case "stalling":
      return `Your ${name} progress appears to be slowing across recent sessions.`;
    case "plateaued":
      return `Your recorded ${name} performance has shown no meaningful progression across the recent training period.`;
    case "regressing":
      return `Recent ${name} performance is consistently below your earlier baseline.`;
  }
}

function chartViewModel(analysis: LiftAnalysis, metric: TrendMetric) {
  const { trends } = analysis;
  const performanceValue = (week: (typeof trends.weekly)[number]) =>
    trends.basis === "effort_adjusted" ? week.adjusted : week.raw;
  const reference = trends.performance.baseline;

  const points: BarChartPoint[] = trends.weekly.map((week, index) => {
    const rawValue =
      metric === "volume"
        ? week.volume
        : metric === "e1rm"
          ? week.raw
          : performanceValue(week);
    const value =
      rawValue === null
        ? null
        : metric === "performance"
          ? reference !== null && reference > 0
            ? (rawValue / reference) * 100
            : null
          : rawValue;
    const formatted =
      value === null
        ? "No data"
        : `${number.format(value)} ${metric === "performance" ? "index" : metric === "volume" ? "kg volume" : "kg estimated 1RM"}`;

    return {
      id: String(week.startsAt),
      label: `W${index + 1}`,
      value,
      partial: week.partial,
      description: `${date.format(week.startsAt)}–${date.format(week.endsAt)}: ${formatted}${week.partial ? " · Incomplete week" : ""}`,
    };
  });

  const change =
    metric === "volume"
      ? trends.volumeChange
      : metric === "e1rm"
        ? trends.raw.change
        : trends.performance.change;
  const label =
    metric === "performance"
      ? "PERFORMANCE TREND"
      : metric === "e1rm"
        ? "ESTIMATED 1RM TREND"
        : "COMPETITION VOLUME";

  return {
    title: label,
    points,
    delta:
      change.status === "available"
        ? `6W ${formatChange(change.value)}`
        : "BUILDING HISTORY",
    color:
      metric === "volume" || change.status !== "available"
        ? colors.primarySoft
        : change.value > 0
          ? colors.success
          : change.value < 0
            ? colors.error
            : colors.muted,
    emptyMessage:
      metric === "volume"
        ? "No eligible competition volume in these weeks."
        : metric === "performance" && reference === null
          ? "More history is needed for a comparison baseline. View E1RM for early estimates."
          : "No eligible performance points in these weeks.",
    basis:
      metric !== "performance"
        ? metric === "volume"
          ? "Completed non-warmup competition sets"
          : "Estimated from load and repetitions"
        : `${trends.basis === "effort_adjusted" ? "Includes recorded effort" : "Based on load and repetitions"} · Index 100 = earlier comparison period`,
  };
}

export function createProgressViewModel(
  overview: ProgressOverview,
  family: LiftFamily,
  metric: TrendMetric,
  outdated = false,
) {
  const analysis = overview.lifts[family];
  const appearance = appearances[analysis.status.value];
  const target = outdated ? null : analysis.recommendation.benchmark;
  const explanation = diagnoses[analysis.diagnosis.kind];

  const supported = analysis.evidence.supportingDays;
  const considered = analysis.evidence.consideredDays;
  const evidenceSummary =
    analysis.status.value === "learning"
      ? "The available history is not yet sufficient for a reliable classification."
      : `${supported} of the latest ${considered} performance days support this assessment against the earlier baseline.`;
  const performance = analysis.trends.performance.change;

  return {
    family,
    selector: (["squat", "bench", "deadlift"] as const).map((value) => ({
      value,
      label: liftLabels[value],
      status: overview.lifts[value].status.value.toUpperCase(),
      ...appearances[overview.lifts[value].status.value],
    })),
    status: {
      title: titles[family],
      label: analysis.status.value.toUpperCase(),
      summary: statusSummary(analysis),
      ...appearance,
      evidence: `${analysis.evidence.level.toUpperCase()} EVIDENCE`,
      performance:
        performance.status === "available"
          ? formatChange(performance.value)
          : "—",
      estimatedMax:
        analysis.currentEstimatedMax.status === "available"
          ? number.format(analysis.currentEstimatedMax.value)
          : "—",
      count: String(analysis.analyzedSessionCount),
      estimateNote:
        analysis.trends.contextDays.length > 0 &&
        analysis.trends.contextDays.length < 3
          ? "Early estimate from limited history"
          : null,
    },
    action: {
      ...recommendations[analysis.recommendation.kind],
      benchmark: target
        ? {
            label:
              target.intent === "progress"
                ? "NEXT PERFORMANCE TARGET"
                : "NEXT BENCHMARK",
            value: `${load.format(target.weight)} KG × ${target.reps}`,
            rpe: target.rpe
              ? `TARGET RPE ${target.rpe.min}–${target.rpe.max}`
              : null,
            explanation:
              target.intent === "progress"
                ? "A small increase supported by repeated performance and recorded effort."
                : target.intent === "reduce_stress"
                  ? "A lower-stress exposure for comparison; this is not a complete workout."
                  : target.rpe
                    ? "Repeat a familiar workload to keep the comparison useful."
                    : "Repeat a familiar workload. Effort headroom is unknown without RPE.",
          }
        : null,
      footer: `Continue monitoring your next two comparable competition-${liftLabels[family].toLowerCase()} sessions.`,
    },
    why: {
      rows: [
        evidenceRow("performance", "Performance", performance, 10),
        evidenceRow("e1rm", "Estimated 1RM", analysis.trends.raw.change, 10),
        evidenceRow(
          "rpe",
          "Typical recorded RPE",
          analysis.trends.rpeChange,
          2,
          true,
          "",
        ),
        evidenceRow(
          "volume",
          "Weekly competition volume",
          analysis.trends.volumeChange,
          50,
          true,
        ),
      ],
      summary: evidenceSummary,
      diagnosis: explanation.title
        ? {
            ...explanation,
            evidence: `${analysis.diagnosis.evidence.toUpperCase()} EVIDENCE`,
          }
        : null,
    },
    chart: chartViewModel(analysis, metric),
    methods: [
      `Analysis updated ${new Date(overview.analysisTime).toLocaleString("en-US")}.`,
      `Performance compares medians from two 21-day periods: ${date.format(analysis.trends.performance.window.from)}–${date.format(analysis.trends.performance.window.through)}. Status also considers up to eight weeks of continuous exposures.`,
      "One workout creates one exposure. Multiple workouts on a day share one daily median for status evidence.",
      "Estimated 1RM uses the Brzycki formula for 1–10 reps. It is an estimate, not a tested maximum. Known effort below RPE 7 is excluded from strength estimation.",
      analysis.trends.basis === "effort_adjusted"
        ? "Performance includes an RIR estimate from recorded RPE. Both comparison periods meet coverage requirements; missing adjusted points remain empty."
        : "Performance uses load and repetitions. RPE is optional; incomplete effort history is not filled in.",
      `Weekly workload compares the latest three complete weeks with the preceding three: ${date.format(analysis.trends.workloadWindow.from)}–${date.format(analysis.trends.workloadWindow.through)}. The current week is excluded.`,
      "Evidence bars start at a central zero marker. Full-scale ranges are ±10% performance/estimated 1RM, ±2 RPE points, and ±50% volume. These are change scales, not confidence percentages.",
      "The chart uses actual zero-based heights. Volume increases are neutral: more work does not automatically mean better training.",
      "Only recorded competition lifts are included. Variations, accessories, technique changes, recovery, and training intentions may affect the picture. Diagnoses are hypotheses.",
      "Benchmarks are optional comparable exposures, not complete workouts. Changed loads use 2.5 kg steps. No intervention is tracked or applied automatically.",
      "Plateaued describes sustained flat recorded performance. Maintaining strength may be your intention.",
    ],
  };
}

export type ProgressViewModel = ReturnType<typeof createProgressViewModel>;
