import { available, unavailable } from "../measurements/progress.measurements";
import { median } from "../measurements/progress.measurements.utils";
import { type ProgressConfig, progressConfig } from "../progress.config";

import type {
  OverallRepTrend,
  RepLaneAgreement,
} from "./progress.overallRepTrends.types";
import type { RepLaneTrend } from "./progress.repLaneTrends.types";

type QualifyingRepLane = RepLaneTrend & {
  basis: Exclude<RepLaneTrend["basis"], "insufficient">;
  change: Extract<RepLaneTrend["change"], { status: "available" }>;
};

function isQualifyingLane(lane: RepLaneTrend): lane is QualifyingRepLane {
  // Step 3's available result already certifies period and selected-basis eligibility.
  return (
    lane.change.status === "available" &&
    Number.isFinite(lane.change.value) &&
    (lane.basis === "rpe_adjusted" || lane.basis === "raw_load")
  );
}

function classifyAgreement(
  changes: readonly number[],
  config: ProgressConfig,
): RepLaneAgreement {
  if (changes.length === 1) return "single_lane";

  const epsilon = config.comparisonEpsilon;

  const positiveCount = changes.filter(
    (change) => change >= config.progressPercent - epsilon,
  ).length;
  const negativeCount = changes.filter(
    (change) => change <= config.regressionPercent + epsilon,
  ).length;

  // Equal nonzero counts of meaningful directions conflict even if the median is neutral.
  if (positiveCount > 0 && positiveCount === negativeCount) {
    return "major_conflict";
  }

  // The more numerous meaningful direction establishes opposition. Neutral-band
  // fluctuations do not oppose it; without a meaningful direction there is no opposition.
  const opposing =
    positiveCount > negativeCount
      ? changes.filter((change) => change < -config.neutralPercent - epsilon)
      : negativeCount > positiveCount
        ? changes.filter((change) => change > config.neutralPercent + epsilon)
        : [];
  const opposition = Math.max(0, ...opposing.map(Math.abs));

  // Insufficient is handled before classification. Remaining precedence is single
  // lane, major conflict, meaningful disagreement, uneven, minor, consistent.
  if (opposition >= config.repLaneMajorOppositionPercent - epsilon) {
    return "major_conflict";
  }
  if (opposition >= config.repLaneMinorOppositionPercent - epsilon) {
    return "meaningful_disagreement";
  }

  const spread = Math.max(...changes) - Math.min(...changes);

  if (spread > config.repLaneUnevenSpreadPercent + epsilon) return "uneven";
  if (opposing.length > 0) return "minor_disagreement";

  return "consistent";
}

function aggregateFamily(
  family: RepLaneTrend["family"],
  lanes: readonly RepLaneTrend[],
  config: ProgressConfig,
): OverallRepTrend {
  const qualifying = lanes
    .filter(isQualifyingLane)
    .sort((a, b) => a.reps - b.reps);
  const changes = qualifying.map((lane) => lane.change.value);
  const overallChange = median(changes);

  if (overallChange === null) {
    return {
      family,
      change: unavailable("insufficient_history"),
      contributingReps: [],
      agreement: "insufficient",
      measurementBasis: "insufficient",
      evidenceCap: null,
    };
  }

  const agreement = classifyAgreement(changes, config);
  const measurementBasis = qualifying.every(
    (lane) => lane.basis === "rpe_adjusted",
  )
    ? "rpe_adjusted"
    : qualifying.every((lane) => lane.basis === "raw_load")
      ? "raw_load"
      : "mixed";

  const permitsStrong =
    measurementBasis === "rpe_adjusted" &&
    (agreement === "single_lane" ||
      agreement === "consistent" ||
      agreement === "minor_disagreement");

  return {
    family,
    change: available(overallChange),
    contributingReps: qualifying.map((lane) => lane.reps),
    agreement,
    measurementBasis,
    evidenceCap: permitsStrong ? "strong" : "moderate",
  };
}

/**
 * Summarizes Step 3's unique lift/rep lanes with one equal contribution per lane.
 * History selection and final status/evidence evaluation remain with their callers.
 */
export function deriveOverallRepTrends(
  laneTrends: readonly RepLaneTrend[],
  config: ProgressConfig = progressConfig,
): OverallRepTrend[] {
  const families = new Map<RepLaneTrend["family"], RepLaneTrend[]>();
  for (const lane of laneTrends) {
    const familyLanes = families.get(lane.family);
    if (familyLanes) familyLanes.push(lane);
    else families.set(lane.family, [lane]);
  }

  return [...families.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([family, lanes]) => aggregateFamily(family, lanes, config));
}
