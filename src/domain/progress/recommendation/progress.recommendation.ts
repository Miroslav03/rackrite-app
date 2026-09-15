import type { LiftDiagnosis } from "../diagnosis/progress.diagnosis.types";
import type { EvidenceAssessment } from "../evidence/progress.evidence.types";
import type { StatusAssessment } from "../status/progress.status.types";

import type { RecommendationKind } from "./progress.recommendation.types";

export function recommendLiftAction(
  status: StatusAssessment,
  evidence: EvidenceAssessment,
  diagnosis: LiftDiagnosis,
): RecommendationKind {
  if (diagnosis.kind === "inconsistent_training") return "restore_consistency";

  if (status.value === "learning") return "gather_evidence";

  if (status.value === "progressing") return "continue_approach";

  if (status.value === "stable") return "continue_approach";

  if (evidence.level === "weak")
    return status.value === "stalling" ? "monitor" : "gather_evidence";

  if (diagnosis.evidence !== "weak") {
    if (
      diagnosis.kind === "fatigue" ||
      diagnosis.kind === "excessive_intensity"
    )
      return "reduce_stress";

    if (diagnosis.kind === "insufficient_stimulus") return "review_stimulus";
  }

  if (status.value === "stalling") return "monitor";

  if (status.value === "regressing") return "reassess";

  return "gather_evidence";
}
