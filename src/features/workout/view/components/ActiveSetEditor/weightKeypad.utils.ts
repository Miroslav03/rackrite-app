import type { WeightKeypadKey } from "./activeSetEditor.types";

const MAX_WEIGHT_DRAFT_LENGTH = 6;
const MAX_DECIMAL_PLACES = 2;

export function formatWeightDraft(weight: number | null): string {
  return weight === null ? "" : String(weight);
}

export function updateWeightDraft(
  currentDraft: string,
  key: WeightKeypadKey,
): string {
  if (key === "clear") {
    return "";
  }

  if (key === "delete") {
    return currentDraft.slice(0, -1);
  }

  if (key === ".") {
    if (currentDraft.includes(".")) {
      return currentDraft;
    }

    return currentDraft === "" ? "0." : `${currentDraft}.`;
  }

  const nextDraft = currentDraft === "0" ? key : `${currentDraft}${key}`;

  if (nextDraft.length > MAX_WEIGHT_DRAFT_LENGTH) {
    return currentDraft;
  }

  const decimalDigits = nextDraft.split(".")[1]?.length ?? 0;

  return decimalDigits <= MAX_DECIMAL_PLACES ? nextDraft : currentDraft;
}

export function parseWeightDraft(draft: string): number | null {
  if (draft === "") {
    return null;
  }

  const weight = Number(draft);

  return Number.isFinite(weight) && weight >= 0 ? weight : null;
}
