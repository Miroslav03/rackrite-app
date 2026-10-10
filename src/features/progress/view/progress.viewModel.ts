import { Ionicons } from "@expo/vector-icons";

import type { ComponentProps } from "react";

import type { LiftFamily } from "@/domain/domain.types";
import type {
  LiftAnalysis,
  ProgressOverview,
} from "@/domain/progress/analysis/progress.analysis.types";
import type {
  BenchmarkTarget,
  BenchmarkUnavailableReason,
} from "@/domain/progress/benchmark/progress.benchmark.types";
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
import type { PerformanceBasis } from "@/domain/progress/trends/progress.trends.types";

import { colors } from "@/shared/theme/tokens";

export type EvidenceRowId = "strength" | "effort" | "hard_sets" | "frequency";
type IoniconName = NonNullable<ComponentProps<typeof Ionicons>["name"]>;

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

export const evidenceIcons: Record<
  EvidenceRowId,
  { name: IoniconName; color: string }
> = {
  strength: { name: "stats-chart-outline", color: colors.successBorder },
  effort: { name: "barbell-outline", color: colors.primarySoft },
  hard_sets: { name: "flame-outline", color: colors.warning },
  frequency: { name: "pulse-outline", color: "#A78BFA" },
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
  no_history: "No recent workouts logged for this lift",
  no_performance: "No sets available for a reliable strength comparison",
  insufficient_history:
    "Log more similar sets across several weeks to compare results",
  missing_rpe: "No effort ratings (RPE) logged for these sets",
  partial_rpe:
    "More consistent RPE logging is needed for a reliable comparison",
  invalid_baseline: "There is no usable earlier value to compare with",
  incomplete_period: "More full weeks of training history are needed",
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
    none: {
      title: "",
      description: "",
    },

    fatigue: {
      title: "HIGHER TRAINING STRESS",
      description:
        "Effort and hard competition work have increased while performance has stopped improving or started to decline.",
    },

    excessive_intensity: {
      title: "TOO MUCH HIGH-EFFORT WORK",
      description:
        "Repeated RPE 9–10 sets appear alongside flat or declining performance. Reducing effort temporarily may help.",
    },

    insufficient_stimulus: {
      title: "LOWER TRAINING LOAD",
      description:
        "Your recent competition-lift workload or training frequency is lower than during your previous productive period.",
    },

    inconsistent_training: {
      title: "INCONSISTENT TRAINING",
      description:
        "Training gaps make it harder to compare your performance reliably over time.",
    },

    insufficient_evidence: {
      title: "CAUSE NOT CLEAR YET",
      description:
        "There is not enough consistent evidence yet to identify what is affecting your performance.",
    },
  };

const recommendations: Record<
  RecommendationKind,
  { title: string; description: string }
> = {
  continue_approach: {
    title: "KEEP GOING",
    description:
      "Your recent training is working. No meaningful change is needed right now.",
  },
  monitor: {
    title: "WAIT AND WATCH",
    description:
      "Complete two more comparable sessions before making a major change.",
  },
  reduce_stress: {
    title: "REDUCE TRAINING STRESS",
    description:
      "Ease back on hard competition-lift work for a short period, then reassess.",
  },
  review_stimulus: {
    title: "REVIEW YOUR WORKLOAD",
    description:
      "Your recent workload may not be enough to drive progress. Adjust one variable at a time.",
  },
  restore_consistency: {
    title: "REBUILD CONSISTENCY",
    description:
      "Train and log this lift more consistently so RackRite can identify a reliable trend.",
  },
  gather_evidence: {
    title: "KEEP LOGGING",
    description:
      "More comparable sessions are needed before making a confident training change. RPE is optional.",
  },
  reassess: {
    title: "RESET AND REASSESS",
    description:
      "Performance has declined repeatedly. Use a lighter benchmark before increasing the load again.",
  },
};

export function formatChange(value: number, unit = "%"): string {
  const rounded = Math.abs(value) < 0.05 ? 0 : value;

  return `${rounded > 0 ? "+" : ""}${number.format(rounded)}${unit}`;
}

export type EvidenceRowViewModel = {
  id: EvidenceRowId;
  label: string;
  value: string;
  note: string | null;
};

function evidenceRow(
  id: EvidenceRowId,
  label: string,
  measurement: Measurement,
  unit = "%",
): EvidenceRowViewModel {
  if (measurement.status === "unavailable")
    return {
      id,
      label,
      value: "—",
      note: missing[measurement.reason],
    };

  const value = measurement.value;

  return {
    id,
    label,
    value: formatChange(value, unit),
    note: null,
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
      return `Your recent ${name} performance is holding steady.`;
    case "stalling":
      return `Your ${name} progress appears to be slowing across recent sessions.`;
    case "plateaued":
      return `Your ${name} performance has shown no meaningful progression across the recent training period.`;
    case "regressing":
      return `Recent ${name} performance is consistently below your earlier baseline.`;
  }
}

function getTargetExplanation(target: BenchmarkTarget): string {
  const reference = `${load.format(target.referenceWeight)} KG × ${target.reps}`;

  switch (target.intent) {
    case "progress":
      return `${target.sources.length} comparable sessions support increasing from ${reference}. Your recorded effort suggests there is room to add weight.`;

    case "reduce_stress":
      switch (target.reason) {
        case "repeated_decline":
          return `Recent comparable sessions show a repeated strength decline, so the next target is reduced from ${reference}.`;

        case "high_effort_reference":
          return `Your latest ${reference} was harder than the target effort, so the next target is slightly reduced.`;

        default:
          return `Recent sessions around ${reference} have been consistently harder than expected, so the next target is slightly reduced.`;
      }

    case "repeat":
      switch (target.reason) {
        case "effort_headroom_unknown":
          return `Repeat ${reference}. More consistent RPE data is needed before increasing the load.`;

        default:
          return `Repeat ${reference}. Recent strength and effort do not yet support increasing the load.`;
      }
  }
}

export const strengthBasisLabels: Record<PerformanceBasis, string> = {
  matched_reps_rpe: "Compared at similar reps & RPE",
  matched_reps: "Compared at similar reps",
  effort_adjusted: "Estimated using load, reps & RPE",
  load_reps: "Estimated using load & reps",
};

const withheld: Record<BenchmarkUnavailableReason, string> = {
  learning:
    "Keep logging similar competition sets for a few more weeks before setting a benchmark.",
  weak_evidence:
    "More consistent training data is needed before RackRite can suggest a specific target.",
  training_gaps:
    "Log your competition lift more consistently before setting a new benchmark.",
  stale_history:
    "Log some recent comparable sets before setting a new benchmark.",
  conflicting_signals:
    "Your recent performance is mixed. More comparable sets are needed before setting a target.",
  comparable_exposures:
    "Log at least three comparable sessions using the same 2–6 rep range across seven or more days.",
  outlier:
    "Your latest performance differs too much from your recent trend. Another comparable session is needed.",
  effort_capacity:
    "There is not enough reliable effort data yet to recommend a lower load.",
  rounding_limits:
    "A safe load adjustment cannot be made with the available plate increments.",
};

export function createProgressViewModel(
  overview: ProgressOverview,
  family: LiftFamily,
  outdated = false,
) {
  const analysis = overview.lifts[family];
  const { trends } = analysis;
  const appearance = appearances[analysis.status.value];
  const target = outdated ? null : analysis.recommendation.benchmark;
  const explanation = diagnoses[analysis.diagnosis.kind];
  const performance = trends.performance.change;

  const supported = analysis.evidence.supportingDays;
  const considered = analysis.evidence.consideredDays;
  const evidenceSummary =
    analysis.status.value === "learning"
      ? "More similar workouts are needed to assess your strength trend reliably."
      : `${supported} of ${considered} recent training days support this status when compared with your earlier results.`;

  const basis = strengthBasisLabels[trends.basis];

  const estimateComparison =
    analysis.currentEstimatedMaxBasis === "effort_adjusted"
      ? trends.adjusted
      : trends.raw;
  const estimateChange =
    analysis.currentEstimatedMax.status === "available" &&
    estimateComparison.change.status === "available" &&
    estimateComparison.baseline !== null
      ? Math.round(
          (analysis.currentEstimatedMax.value - estimateComparison.baseline) *
            10,
        ) /
          10 ===
        0
        ? null
        : `${formatChange(
            Math.round(
              (analysis.currentEstimatedMax.value -
                estimateComparison.baseline) *
                10,
            ) / 10,
            "",
          )}`
      : null;

  const strengthRow = evidenceRow(
    "strength",
    trends.strength.buckets.length
      ? "Comparable strength"
      : "Estimated strength trend",
    performance,
  );
  strengthRow.note =
    performance.status === "available"
      ? `${evidenceSummary} ${basis}.`
      : strengthRow.note;

  const effortRow = evidenceRow(
    "effort",
    "Effort",
    trends.effort.change,
    " RPE",
  );
  effortRow.note =
    trends.effort.change.status === "available"
      ? trends.effort.basis === "matched"
        ? `The same weight and reps felt ${trends.effort.change.value < -0.05 ? "easier" : trends.effort.change.value > 0.05 ? "harder" : "about the same"}, based on your logged RPE.`
        : "This compares your usual logged RPE. There aren't enough sets at the same weight and reps for a direct comparison."
      : effortRow.note;

  const workRow = evidenceRow(
    "hard_sets",
    "Hard competition work",
    trends.hardSetsChange,
  );
  if (
    trends.baselineWeeklyHardSets !== null &&
    trends.recentWeeklyHardSets !== null
  ) {
    const weeklySets =
      trends.baselineWeeklyHardSets === trends.recentWeeklyHardSets
        ? `You averaged ${number.format(trends.recentWeeklyHardSets)} hard sets per week in both periods (RPE 8+).`
        : `You averaged ${number.format(trends.recentWeeklyHardSets)} hard sets per week, compared with ${number.format(trends.baselineWeeklyHardSets)} before (RPE 8+).`;
    const coverage =
      trends.baselineWorkloadRpeCoverage === trends.recentWorkloadRpeCoverage
        ? `You logged RPE for ${number.format(trends.recentWorkloadRpeCoverage * 100)}% of sets in both periods.`
        : `You logged RPE for ${number.format(trends.recentWorkloadRpeCoverage * 100)}% of sets, compared with ${number.format(trends.baselineWorkloadRpeCoverage * 100)}% before.`;
    workRow.note = `${weeklySets} ${coverage}${trends.hardSetsChange.status === "unavailable" ? ` ${missing[trends.hardSetsChange.reason]}.` : ""}`;
  }
  const consistencyRow = evidenceRow(
    "frequency",
    "Consistency",
    trends.frequencyChange,
  );
  const hasHistory = trends.contextDays.length > 0;
  consistencyRow.value = !hasHistory
    ? "—"
    : analysis.diagnosis.kind === "inconsistent_training"
      ? "Gaps recorded"
      : analysis.status.value === "learning"
        ? "Building history"
        : "Consistent";
  if (trends.recentWeeklyFrequency === null) {
    consistencyRow.note = hasHistory
      ? "More full weeks of training history are needed to compare how often you log this lift."
      : "No recent training logged for this lift.";
  } else {
    const frequency =
      trends.baselineWeeklyFrequency === trends.recentWeeklyFrequency
        ? `You logged this lift on an average of ${number.format(trends.recentWeeklyFrequency)} days per week in both periods.`
        : `You logged this lift on an average of ${number.format(trends.recentWeeklyFrequency)} days per week, compared with ${number.format(trends.baselineWeeklyFrequency ?? 0)} before.`;
    const gap = `Longest gap between logged training days: ${trends.maxGapDays} ${trends.maxGapDays === 1 ? "day" : "days"}.`;
    const weeksWithoutTraining =
      trends.missingCompleteWeeks === 0
        ? "No full weeks without a logged session."
        : `${trends.missingCompleteWeeks} full ${trends.missingCompleteWeeks === 1 ? "week" : "weeks"} without a logged session.`;
    consistencyRow.note = `${frequency} ${gap} ${weeksWithoutTraining}`;
  }
  const referenceDates = target?.sources.length
    ? `${date.format(target.sources[0].workoutFinishedAt)}–${date.format(target.sources[target.sources.length - 1].workoutFinishedAt)}`
    : null;

  /*   const targetExplanation = target
    ? target.intent === "progress"
      ? `${target.sources.length} comparable exposures support one increment from ${load.format(target.referenceWeight)} KG × ${target.reps}, with recorded effort headroom.`
      : target.intent === "reduce_stress"
        ? `${target.reason === "repeated_decline" ? "Repeated strength decline supports" : target.reason === "high_effort_reference" ? "Your latest reference exceeded the target effort range, supporting" : "The recorded higher-stress pattern supports"} a conservative reduction from ${load.format(target.referenceWeight)} KG × ${target.reps}.`
        : target.reason === "effort_headroom_unknown"
          ? `Repeat the established ${load.format(target.referenceWeight)} KG × ${target.reps}. Effort headroom is unknown without consistent RPE.`
          : `Repeat the established ${load.format(target.referenceWeight)} KG × ${target.reps}. Current strength and effort do not support an increase yet.`
    : null; */

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
      basis,
      performance:
        performance.status === "available"
          ? formatChange(performance.value)
          : null,
      /*       performanceLabel: trends.strength.buckets.length
        ? "Strength vs similar sets" // stronger, like-for-like evidence
        : "Estimated strength", // fallback, formula-derived */
      estimatedMax:
        analysis.currentEstimatedMax.status === "available"
          ? number.format(analysis.currentEstimatedMax.value)
          : null,
      estimateChange,
      estimateNote:
        analysis.status.reason === "stale_history"
          ? "Estimate may be stale"
          : trends.contextDays.length > 0 &&
              trends.contextDays.length < 3 &&
              analysis.currentEstimatedMax.status === "available"
            ? "Based on limited history"
            : null,
    },
    action: {
      ...recommendations[analysis.recommendation.kind],
      unavailable: outdated
        ? "These results are outdated. Refresh successfully to see a benchmark."
        : analysis.recommendation.benchmarkUnavailableReason
          ? withheld[analysis.recommendation.benchmarkUnavailableReason]
          : "No specific target is supported by this history.",
      benchmark: target
        ? {
            label:
              target.intent === "progress"
                ? "INCREASE"
                : target.intent === "reduce_stress"
                  ? "REDUCE"
                  : "REPEAT",
            value: `${load.format(target.weight)} KG × ${target.reps}`,
            weight: load.format(target.weight),
            reps: target.reps,
            rpe: target.rpe ? `RPE ${target.rpe.min}–${target.rpe.max}` : null,
            /*    delta:
              target.loadChange === 0
                ? "Same load"
                : formatChange(target.loadChange, " KG"), */
            delta:
              target.loadChange === 0
                ? {
                    type: "same" as const,
                    label: "",
                  }
                : {
                    type: "change" as const,
                    value: formatChange(target.loadChange, ""),
                    unit: "KG",
                  },
            evidence: `${target.evidence.toUpperCase()} EVIDENCE`,
            basis: strengthBasisLabels[target.basis],
            explanation: getTargetExplanation(target),
            sources: referenceDates
              ? `${target.sources.length} reference days · ${referenceDates}`
              : null,
          }
        : null,
    },
    why: {
      title:
        analysis.status.value === "learning"
          ? "LEARNING"
          : analysis.status.value.toUpperCase(),
      rows: [strengthRow, effortRow, workRow, consistencyRow],
      diagnosis: explanation.title
        ? {
            ...explanation,
            evidence: `${analysis.diagnosis.evidence.toUpperCase()} EVIDENCE`,
            reference: analysis.diagnosis.referenceWindow
              ? `Reference period: ${date.format(analysis.diagnosis.referenceWindow.from)} – ${date.format(analysis.diagnosis.referenceWindow.through)}`
              : null,
          }
        : null,
    },
    methods: [
      `Analysis updated ${new Date(overview.analysisTime).toLocaleString("en-US")}.`,
      `Strength compares two 21-day periods: ${date.format(trends.performance.window.from)}–${date.format(trends.performance.window.through)}. Active basis: ${basis}.`,
      "Direct comparisons match repetitions from 1–6 and, when effort is available, RPE bands 7–8, above 8–9, and above 9–10. Each bucket needs three days in both periods; matched observations must cover at least 80% of performance days. Daily loads use medians across periods; bucket changes use a count-weighted median.",
      "Several sets or workouts on a day count once for strength evidence and exposure frequency. Matched effort compares daily median RPE at the same load and repetitions.",
      "Estimated max uses the best qualified raw or effort-adjusted estimate from the latest three performance days. Recorded RPE adds estimated reps in reserve to Brzycki, bounded to ten effective repetitions; unsupported effort estimates fall back to raw load and reps. The kilogram comparison uses the earlier baseline from the same formula. It is not a tested maximum. Known effort below RPE 7 is excluded from strength estimation.",
      `Workload compares three complete weeks with the preceding three: ${date.format(trends.workloadWindow.from)}–${date.format(trends.workloadWindow.through)}. Hard sets have recorded RPE 8+; very hard sets have RPE 9+. Missing RPE is not easy work. Comparisons require at least 70% coverage in both periods, within ten percentage points.`,
      "Only recorded competition lifts are included. Variations, accessories, technique, recovery and training intentions can affect the picture. Diagnoses describe patterns, not measured causes. A lower-work explanation needs a comparable personal productive period within the last 24 weeks.",
      "Benchmarks are optional comparison targets, not workouts. Changed loads use 2.5 kg steps with conservative caps. No target is saved or applied automatically. Stable strength may be intentional.",
    ],
  };
}

export type ProgressViewModel = ReturnType<typeof createProgressViewModel>;
