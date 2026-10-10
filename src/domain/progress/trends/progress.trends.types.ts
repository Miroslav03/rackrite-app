import type {
  AnalysisWindow,
  Measurement,
} from "../measurements/progress.measurements.types";
import type { LiftSessionMetrics } from "../sessions/progress.sessions.types";
import type {
  EffortComparison,
  StrengthComparison,
} from "../strength/progress.strength.types";

/**
 * Which formula supplies a strength estimate: weight and reps alone,
 * or weight and reps adjusted using recorded RPE.
 */
export type EstimateBasis = "load_reps" | "effort_adjusted";

/**
 * How strength is compared over time. Sets can be matched by reps and,
 * when available, similar RPE. Otherwise a formula estimate is used.
 */
export type PerformanceBasis =
  EstimateBasis | "matched_reps" | "matched_reps_rpe";

/**
 * One competition lift summarized for one local calendar day. Raw and
 * adjusted values are separate medians of session estimates, so several
 * workouts on the same day do not count as several days of trend evidence.
 */
export type DailyPerformance = {
  day: number; // Local calendar-day number for grouping and gap checks; not a millisecond timestamp.
  finishedAt: number; // Latest included workout completion time that day, in milliseconds.
  sessions: readonly LiftSessionMetrics[]; // Same-lift workout summaries with usable raw performance on this day.
  raw: number; // Median session raw estimate for this day, in kg.
  adjusted: number | null; // Median available adjusted estimate for this day; null when none exists.
  representativeReps: number; // Median raw-representative rep count, used to detect changed rep ranges.
};

/**
 * The older and newer performance medians, their percentage change, and
 * supporting day counts. This captures direction over a comparison window
 * for status rules and the six-week change displayed in the UI.
 */
export type TrendComparison = {
  window: AnalysisWindow; // Six-week period covered by this comparison.
  baseline: number | null; // Earlier reference value: kg for estimates, 100 for normalized strength; null when unavailable.
  recent: number | null; // Recent value: kg for estimates, 100 + percentage change for normalized strength; null when unavailable.
  change: Measurement; // Percentage change between medians, or why comparison is unavailable.
  baselineDays: number; // Number of usable daily values in the earlier half.
  recentDays: number; // Number of usable daily values in the recent half.
};

/**
 * One calendar week of competition workload and exposure counts. The partial
 * flag identifies a week that is still in progress and cannot be compared.
 */
export type WeeklyLiftMetrics = {
  startsAt: number; // Monday at local midnight, as a millisecond timestamp.
  partial: boolean; // True for an unfinished week, which is excluded from workload comparisons.
  volume: number | null; // Weekly valid competition volume in kg; null for unknown history, zero for an empty recorded period.
  exposures: number; // Distinct local days with valid competition training.
  hardSets: number | null; // Number of valid sets with recorded RPE 8+ this week; null when the count is unknown.
  validSets: number; // Number of valid completed non-warmup sets, including sets outside the strength-estimate rep range.
  rpeSets: number; // Number of those valid sets with a usable recorded RPE.
};

/**
 * The combined trends for one lift: daily history, comparisons, and
 * comparability checks. Status, evidence, diagnosis, and evidence rows reuse
 * these facts.
 */
export type LiftTrendMetrics = {
  // Which estimates should the analysis use?
  basis: PerformanceBasis; // Direct comparison or explicitly selected formula fallback.
  strength: StrengthComparison; // Earlier versus recent strength, with the matching sets or formula used to compare it.
  effort: EffortComparison; // Earlier versus recent RPE at matching loads and reps, or typical RPE when matching is unavailable.
  // Supporting daily history
  days: readonly DailyPerformance[]; // Six-week performance days
  contextDays: readonly DailyPerformance[]; // Up to 8 weeks in the current continuous segment

  // Strength comparisons: earlier median versus recent median
  raw: TrendComparison; // Weight-and-reps comparison
  adjusted: TrendComparison; // Effort-adjusted comparison
  performance: TrendComparison; // Selected strength comparison, normalized to baseline 100.

  // Recorded effort
  rpeChange: Measurement; // Change in typical RPE, in points
  rpeAdequate: boolean; // Enough RPE information in both halves?
  recentHighEffortShare: number | null; // Fraction of recent recorded-RPE sets at 9–10
  highEffortShareChange: number | null; // Change in that fraction
  highEffortDays: number; // Recent performance days with high-effort work

  // Recorded workload
  volumeChange: Measurement; // Percentage change in average weekly volume
  frequencyChange: Measurement; // Percentage change in distinct training days/week.
  workloadWindow: AnalysisWindow; // Dates of the complete-week comparison
  recentWeeklyVolume: number | null; // Actual recent average weekly volume
  recentWeeklyFrequency: number | null; // Actual recent average exposures per week
  baselineWeeklyFrequency: number | null; // Average distinct training days per week in the earlier workload period; null without complete history.
  baselineWeeklyHardSets: number | null; // Average recorded RPE 8+ sets per week in the earlier workload period; null when unknown.
  recentWeeklyHardSets: number | null; // Average recorded RPE 8+ sets per week in the recent workload period; null when unknown.
  baselineWorkloadRpeCoverage: number; // Share of valid sets with recorded RPE in the earlier workload period, from 0 to 1.
  recentWorkloadRpeCoverage: number; // Share of valid sets with recorded RPE in the recent workload period, from 0 to 1.
  hardSetsChange: Measurement; // Percentage change in average weekly hard sets, or why the periods cannot be compared.
  baselineTypicalRpe: number | null; // Median of usable session RPEs in the earlier strength period; null without enough effort history.
  recentTypicalRpe: number | null; // Median of usable session RPEs in the recent strength period; null without enough effort history.
  missingCompleteWeeks: number; // Complete weeks without recorded exposures

  // Comparability and continuity
  conflictingSignals: boolean; // Do raw and adjusted trends materially oppose?
  repetitionShift: boolean; // Did representative reps change substantially?
  gapReset: boolean; // Did a long break start a new analysis segment?
  maxGapDays: number; // Largest performance-day gap in the current context
};

/**
 * The history grouped into the periods needed by trend calculations. This
 * internal helper result lets performance and effort comparisons use the
 * same selected days, sessions, and training-gap boundaries.
 */

/* 
EXAMPLE:
8-week context: July 19 ───────────────── September 12
6-week comparison:    August 2 ────────── September 12
Earlier half:         August 2–22
Recent half:                      August 23–September 12 
*/

export type ComparisonHistory = {
  contextDays: DailyPerformance[]; // Selected 8-week context
  days: DailyPerformance[]; // Selected 6-week context

  comparisonSessions: LiftSessionMetrics[]; // Workouts in the 6-week period
  baselineSessions: LiftSessionMetrics[]; // Earlier half of those 6 week context
  recentSessions: LiftSessionMetrics[]; // Recent half of that 6 week context

  endExclusive: number; // Where the comparison stops - In the example: September 13 at midnight
  recentStartsAt: number; // Where the recent half begins - In the example: August 23 at midnight
  gapReset: boolean; // Did we find a long break
  maxGapDays: number; // Largest break inside the current context
};
