import type { InteractiveKeypadKey } from "@/shared/components/ui/InteractiveKeypad";

export type ActiveSetEditorKeypadMode = "weight" | "reps";

type KeypadRules = {
  allowDecimal: boolean;
  allowLeadingZero: boolean;
  maxDecimalPlaces: number;
};

const MAX_DRAFT_LENGTH = 6;

const KEYPAD_RULES: Record<ActiveSetEditorKeypadMode, KeypadRules> = {
  weight: {
    allowDecimal: true,
    allowLeadingZero: true,
    maxDecimalPlaces: 2,
  },
  reps: {
    allowDecimal: false,
    allowLeadingZero: false,
    maxDecimalPlaces: 0,
  },
};

export function formatKeypadDraft(value: number | null): string {
  return value === null ? "" : String(value);
}

export function addWeightIncrement(
  currentWeight: number | null,
  increment: number,
): number {
  const nextWeight = (currentWeight ?? 0) + increment;

  return Number(nextWeight.toFixed(KEYPAD_RULES.weight.maxDecimalPlaces));
}

export function updateKeypadDraft(
  currentDraft: string,
  key: InteractiveKeypadKey,
  mode: ActiveSetEditorKeypadMode,
): string {
  const rules = KEYPAD_RULES[mode];

  if (key === "clear") {
    return "";
  }

  if (key === "delete") {
    return currentDraft.slice(0, -1);
  }

  if (key === ".") {
    if (!rules.allowDecimal || currentDraft.includes(".")) {
      return currentDraft;
    }

    return currentDraft === "" ? "0." : `${currentDraft}.`;
  }

  if (key === "0" && currentDraft === "" && !rules.allowLeadingZero) {
    return currentDraft;
  }

  const nextDraft = currentDraft === "0" ? key : `${currentDraft}${key}`;

  if (nextDraft.length > MAX_DRAFT_LENGTH) {
    return currentDraft;
  }

  const decimalDigits = nextDraft.split(".")[1]?.length ?? 0;

  return decimalDigits <= rules.maxDecimalPlaces ? nextDraft : currentDraft;
}

export function parseKeypadDraft(
  draft: string,
  mode: ActiveSetEditorKeypadMode,
): number | null {
  if (draft === "") {
    return null;
  }

  const value = Number(draft);
  const isValid =
    mode === "weight"
      ? Number.isFinite(value) && value >= 0
      : Number.isInteger(value) && value > 0;

  return isValid ? value : null;
}
