export const WEIGHT_INCREMENTS = [2.5, 5, 10] as const;

export const RPE_PICKER_VALUES = [5, 6, 7, 8, 9, 10] as const;

export type RpePickerValue = (typeof RPE_PICKER_VALUES)[number];

export const SET_VALUE_UPDATE_DEBOUNCE_MS = 1000;
