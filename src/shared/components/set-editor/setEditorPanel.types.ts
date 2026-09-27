export type CommonSetEditorPanel =
  { type: "repsKeypad"; draft: string } | { type: "rpe" } | { type: "setType" };

export type RepsKeypadPanel = Extract<
  CommonSetEditorPanel,
  { type: "repsKeypad" }
>;
