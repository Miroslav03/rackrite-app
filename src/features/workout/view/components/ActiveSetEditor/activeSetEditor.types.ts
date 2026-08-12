export type RpePickerValue = (typeof RPE_PICKER_VALUES)[number];
export type WeightKeypadKey = (typeof WEIGHT_KEYPAD_KEY_ROWS)[number][number];

export const RPE_PICKER_VALUES = [5, 6, 7, 8, 9, 10] as const;
export const WEIGHT_KEYPAD_KEY_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "clear", "delete"],
] as const;

export type ActiveSetEditorPanelType = ActiveSetEditorPanel["type"];

export type ActiveSetEditorPanel =
  | { type: "weight" }
  | { type: "weightKeypad"; draft: string }
  | { type: "rpe" }
  | { type: "setType" };

export type WeightKeypadPanel = Extract<
  ActiveSetEditorPanel,
  { type: "weightKeypad" }
>;
