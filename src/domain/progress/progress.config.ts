import { DEFAULT_WEIGHT_INCREMENT_KG } from "@/domain/settings/settings.constants";

// Product heuristics, not calibrated physiological thresholds. Tune and test them together.
export const progressConfig = {
  // Bounded retrieval also permits a limited prior productive-period comparison.
  historyWeeks: 24,
  chartWeeks: 8,
  contextDays: 56,
  trendDays: 42,

  // Distinct performance days, never individual sets or split workouts.
  minimumDays: 6,
  minimumHalfDays: 3,
  minimumSpanDays: 21,

  // Entry thresholds need repeated directional support against the earlier median.
  // Ignore binary floating-point noise at exact percentage boundaries, without rounding metrics.
  comparisonEpsilon: 1e-9,
  progressPercent: 2,
  neutralPercent: 1,
  regressionPercent: -3,
  progressSupportPercent: 1,
  regressionSupportPercent: -2,
  supportDays: 2,
  supportWindow: 3,

  // A prolonged flat pattern needs both calendar time and regular exposures.
  plateauDays: 8,
  plateauSpanDays: 42,
  plateauWeeks: 6,
  plateauBlockDays: 14,
  plateauBlockMinimumDays: 2,
  plateauBandPercent: 1.5,
  regularGapDays: 14,
  resetGapDays: 21,
  staleDays: 21,
  confirmationDays: 2,

  // Exit bands reduce status oscillation near entry thresholds.
  progressExitPercent: 0.5,
  regressionExitPercent: -1,
  plateauExitPercent: 1.5,

  // Formula range and safeguards against unrepresentative effort observations.
  maxEstimateReps: 10,
  minimumPerformanceRpe: 7,
  adjustedRepresentativeFloor: 0.95,
  adjustedDayCoverage: 0.8,
  rpeCoverage: 0.7,

  // Evidence quality describes the observed pattern, not physiological certainty.
  strongDays: 12,
  strongSpanDays: 42,
  strongSupportDays: 4,
  strongSupportWindow: 5,
  strongValidShare: 0.9,
  minimumValidShare: 0.8,
  repetitionShift: 3,
  flatSupportPercent: 2,

  // Causal hypotheses require converging competition-work and effort context.
  fatigueRpeRise: 0.5,
  fatigueVolumeRise: 20,
  frequencyChangePercent: 25,
  highEffortRpe: 9,
  highEffortShare: 0.5,
  highEffortShareRise: 0.2,
  highEffortDays: 3,
  missingWeeks: 2,
  stimulusVolumeDrop: -20,

  // Targets stay recent, familiar, corroborated, and below maximal effort.
  benchmarkLookbackDays: 21,
  benchmarkRecentDays: 14,
  benchmarkWindowDays: 5,
  benchmarkMinimumDays: 3,
  benchmarkSpanDays: 7,
  benchmarkMinimumReps: 2,
  benchmarkMaximumReps: 6,

  // Corroboration and rounding must pass before a changed load is offered.
  benchmarkOutlierPercent: 5,
  benchmarkIncreaseFraction: 0.025,
  benchmarkReductionFraction: 0.05,
  benchmarkMaximumReductionFraction: 0.1,
  benchmarkMinimumRpe: 7,
  benchmarkMaximumRpe: 8,
  weightIncrement: DEFAULT_WEIGHT_INCREMENT_KG,
};

/**
 * The shape of the shared analytical thresholds and limits. Deriving it
 * from the configuration object keeps rule inputs synchronized with the
 * available settings and allows tests to supply explicit configurations.
 */
export type ProgressConfig = typeof progressConfig;
