import { TemplateEditorPanel } from "@/features/templates/editor/view/TemplateEditorDock/templateEditorDock.types";
import { ActiveWorkoutDockPanel } from "@/features/workout/view/components/ActiveWorkoutDock/activeWorkoutDock.types";

import { RepsKeypadPanel } from "./setEditorPanel.types";

export function isRepsKeypadPanel(
  panel: ActiveWorkoutDockPanel | TemplateEditorPanel,
): panel is RepsKeypadPanel {
  return panel.type === "repsKeypad";
}
