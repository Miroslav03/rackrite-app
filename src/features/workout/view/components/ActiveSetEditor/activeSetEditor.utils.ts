import type {
  ActiveSetEditorKeypadPanel,
  ActiveSetEditorPanel,
  RepsKeypadPanel,
  WeightKeypadPanel,
} from "./activeSetEditor.types";

export function isWeightKeypadPanel(
  panel: ActiveSetEditorPanel,
): panel is WeightKeypadPanel {
  return panel.type === "weightKeypad";
}

export function isRepsKeypadPanel(
  panel: ActiveSetEditorPanel,
): panel is RepsKeypadPanel {
  return panel.type === "repsKeypad";
}

export function isActiveSetEditorKeypadPanel(
  panel: ActiveSetEditorPanel,
): panel is ActiveSetEditorKeypadPanel {
  return isWeightKeypadPanel(panel) || isRepsKeypadPanel(panel);
}
