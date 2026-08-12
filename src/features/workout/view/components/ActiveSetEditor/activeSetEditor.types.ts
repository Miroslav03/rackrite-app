export type RpePickerValue = (typeof RPE_PICKER_VALUES)[number];

export const RPE_PICKER_VALUES = [5, 6, 7, 8, 9, 10] as const;

export type ActiveSetEditorPanelType = ActiveSetEditorPanel["type"];

export type ActiveSetEditorPanel =
  | { type: "weight" }
  | { type: "weightKeypad"; draft: string }
  | { type: "repsKeypad"; draft: string }
  | { type: "rpe" }
  | { type: "setType" };

export type ActiveSetEditorBasePanelType = Exclude<
  ActiveSetEditorPanelType,
  "weightKeypad" | "repsKeypad"
>;

export type WeightKeypadPanel = Extract<
  ActiveSetEditorPanel,
  { type: "weightKeypad" }
>;

export type RepsKeypadPanel = Extract<
  ActiveSetEditorPanel,
  { type: "repsKeypad" }
>;

export type ActiveSetEditorKeypadPanel = Extract<
  ActiveSetEditorPanel,
  { draft: string }
>;
