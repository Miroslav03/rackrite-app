import type {
  ActiveSetEditorKeypadPanel,
  ActiveWorkoutDockPanel,
  RepsKeypadPanel,
  WeightKeypadPanel,
} from "./activeWorkoutDock.types";

export function isWeightKeypadPanel(
  panel: ActiveWorkoutDockPanel,
): panel is WeightKeypadPanel {
  return panel.type === "weightKeypad";
}

export function isRepsKeypadPanel(
  panel: ActiveWorkoutDockPanel,
): panel is RepsKeypadPanel {
  return panel.type === "repsKeypad";
}

export function isActiveSetEditorKeypadPanel(
  panel: ActiveWorkoutDockPanel,
): panel is ActiveSetEditorKeypadPanel {
  return isWeightKeypadPanel(panel) || isRepsKeypadPanel(panel);
}
