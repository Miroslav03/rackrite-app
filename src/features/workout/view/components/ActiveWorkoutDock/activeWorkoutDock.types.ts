import { CommonSetEditorPanel } from "@/shared/components/exercise-editor/setEditorPanel.types";

export type ActiveSetEditorPanel =
  | CommonSetEditorPanel
  | { type: "weight" }
  | { type: "weightKeypad"; draft: string };

export type RestTimerPanel = {
  type: "restTimer";
  startedAt: number;
};

export type ActiveWorkoutDockPanel = ActiveSetEditorPanel | RestTimerPanel;

export type ActiveSetEditorPanelType = ActiveSetEditorPanel["type"];

export type ActiveSetEditorBasePanelType = Exclude<
  ActiveSetEditorPanelType,
  "weightKeypad" | "repsKeypad"
>;

export type WeightKeypadPanel = Extract<
  ActiveSetEditorPanel,
  { type: "weightKeypad" }
>;

export type ActiveSetEditorKeypadPanel = Extract<
  ActiveSetEditorPanel,
  { draft: string }
>;
