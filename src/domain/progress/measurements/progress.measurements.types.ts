/**
 * The known reasons a metric cannot be calculated. These let the UI explain
 * missing information instead of showing a misleading zero.
 */
export type UnavailableReason =
  | "no_history"
  | "no_performance"
  | "insufficient_history"
  | "missing_rpe"
  | "partial_rpe"
  | "invalid_baseline"
  | "incomplete_period";

/**
 * A calculated number or an explicit reason it is unavailable. Callers must
 * check which case they received before displaying or using the value.
 */
export type Measurement =
  | {
      status: "available"; // Discriminant: check this before reading the value or unavailable reason.
      value: number; // Calculated number; its metric determines the unit, such as kg, percent, or RPE points.
    }
  | {
      status: "unavailable"; // Discriminant: check this before reading the value or unavailable reason.
      reason: UnavailableReason; // Why no usable number could be calculated; missing data is not zero.
    };

/**
 * The start and end timestamps of an analyzed period. Keeping the period with
 * a result makes it possible to explain which history a comparison describes.
 */
export type AnalysisWindow = {
  from: number; // Inclusive beginning of the comparison period, in milliseconds.
  through: number; // Inclusive end of the comparison period, in milliseconds.
};
