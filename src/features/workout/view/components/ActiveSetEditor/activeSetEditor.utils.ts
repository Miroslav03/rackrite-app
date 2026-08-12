import type {
  ActiveSetEditorPanel,
  WeightKeypadPanel,
} from "./activeSetEditor.types";

export function isWeightKeypadPanel(
  panel: ActiveSetEditorPanel,
): panel is WeightKeypadPanel {
  return panel.type === "weightKeypad";
}
