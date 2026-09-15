import type {
  AnalysisWindow,
  Measurement,
} from "../measurements/progress.measurements.types";
import type { LiftSessionMetrics } from "../sessions/progress.sessions.types";

/**
 * Which strength estimate drives a comparison: weight and reps alone, or
 * weight and reps adjusted for recorded effort. One basis keeps raw and
 * adjusted values from being mixed into the same performance series.
 */
export type PerformanceBasis = "load_reps" | "effort_adjusted";
/**
 * The three chart choices. A shared set of names lets presentation select
 * performance, estimated 1RM, or volume from the already-derived trends.
 */
export type TrendMetric = "performance" | "e1rm" | "volume";

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
  baseline: number | null; // Median estimate in the earlier half, in kg; null without usable values.
  recent: number | null; // Median estimate in the recent half, in kg; null without usable values.
  change: Measurement; // Percentage change between medians, or why comparison is unavailable.
  baselineDays: number; // Number of usable daily values in the earlier half.
  recentDays: number; // Number of usable daily values in the recent half.
};

/**
 * One calendar week of strength estimates, competition volume, and exposure
 * count. It supplies chart points and workload comparisons; the partial flag
 * identifies a week that is still in progress.
 */
export type WeeklyLiftMetrics = {
  startsAt: number; // Monday at local midnight, as a millisecond timestamp.
  endsAt: number; // Last included millisecond before the following Monday.
  partial: boolean; // True for an unfinished week, which is excluded from workload comparisons.
  raw: number | null; // Median raw daily estimate that week, in kg; null without performance data.
  adjusted: number | null; // Median available adjusted daily estimate, in kg; null without values.
  volume: number | null; // Weekly valid competition volume in kg; null for unknown history, zero for an empty recorded period.
  exposures: number; // Workouts with valid training for this lift; not set count or distinct days.
};

/**
 * The combined trends for one lift: daily and weekly summaries, comparisons,
 * and comparability checks. Status, evidence, and diagnosis rules reuse these
 * facts, and the view model uses them to build evidence rows and charts.
 */
export type LiftTrendMetrics = {
  // Which estimates should the analysis use?
  basis: PerformanceBasis; // "load_reps" or "effort_adjusted"

  // Supporting daily history
  days: readonly DailyPerformance[]; // Six-week performance days
  contextDays: readonly DailyPerformance[]; // Up to 8 weeks in the current continuous segment

  // Strength comparisons: earlier median versus recent median
  raw: TrendComparison; // Weight-and-reps comparison
  adjusted: TrendComparison; // Effort-adjusted comparison
  performance: TrendComparison; // The selected raw OR adjusted comparison

  // Recorded effort
  rpeChange: Measurement; // Change in typical RPE, in points
  rpeAdequate: boolean; // Enough RPE information in both halves?
  recentHighEffortShare: number | null; // Fraction of recent recorded-RPE sets at 9–10
  highEffortShareChange: number | null; // Change in that fraction
  highEffortDays: number; // Recent performance days with high-effort work

  // Recorded workload
  volumeChange: Measurement; // Percentage change in average weekly volume
  frequencyChange: Measurement; // Percentage change in weekly workout exposures
  workloadWindow: AnalysisWindow; // Dates of the complete-week comparison
  recentWeeklyVolume: number | null; // Actual recent average weekly volume
  recentWeeklyFrequency: number | null; // Actual recent average exposures per week
  missingCompleteWeeks: number; // Complete weeks without recorded exposures

  // Comparability and continuity
  conflictingSignals: boolean; // Do raw and adjusted trends materially oppose?
  repetitionShift: boolean; // Did representative reps change substantially?
  gapReset: boolean; // Did a long break start a new analysis segment?
  maxGapDays: number; // Largest performance-day gap in the current context

  // Chart data
  weekly: readonly WeeklyLiftMetrics[]; // Eight weekly summaries, including the current partial week
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
  allPerformanceDays: DailyPerformance[]; // All available performance days

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
