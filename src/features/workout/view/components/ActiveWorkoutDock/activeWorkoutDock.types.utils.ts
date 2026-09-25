import { isRepsKeypadPanel } from "@/shared/components/exercise-editor/setEditorPanel.types.utils";

import type {
  ActiveSetEditorKeypadPanel,
  ActiveWorkoutDockPanel,
  WeightKeypadPanel,
} from "./activeWorkoutDock.types";

export function isWeightKeypadPanel(
  panel: ActiveWorkoutDockPanel,
): panel is WeightKeypadPanel {
  return panel.type === "weightKeypad";
}

export function isActiveSetEditorKeypadPanel(
  panel: ActiveWorkoutDockPanel,
): panel is ActiveSetEditorKeypadPanel {
  return isWeightKeypadPanel(panel) || isRepsKeypadPanel(panel);
}
