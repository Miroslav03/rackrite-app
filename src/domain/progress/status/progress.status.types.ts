/**
 * The possible conclusions about recorded lift performance, from Learning
 * to Progressing or Regressing. These give the status rules and UI a shared,
 * finite vocabulary rather than arbitrary labels.
 */
export type LiftStatus =
  | "learning"
  | "progressing"
  | "stable"
  | "stalling"
  | "plateaued"
  | "regressing";

/**
 * Why a status was selected or why a conclusion is not yet supported.
 * These codes let presentation explain the decision without putting UI copy
 * inside the classification rules.
 */
export type StatusReason =
  | "no_history"
  | "no_performance"
  | "insufficient_history"
  | "stale_history"
  | "training_gap"
  | "ambiguous_identity"
  | "conflicting_signals"
  | "confirming_change"
  | "confirmed_trend";

/**
 * The selected status together with its reason and confirmation state.
 * Downstream rules need this context to distinguish a supported pattern
 * from a result that is still awaiting confirmation.
 */
export type StatusAssessment = {
  value: LiftStatus; // Performance label shown on the status card and lift selector.
  reason: StatusReason; // Explanation code for the label or why classification is not yet supported.
  confirmed: boolean; // Whether the selected status has passed repeated-checkpoint confirmation.
};
