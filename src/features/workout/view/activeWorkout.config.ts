import { DEFAULT_WEIGHT_INCREMENT_KG } from "@/domain/settings/settings.constants";

export const WEIGHT_INCREMENTS = [
  DEFAULT_WEIGHT_INCREMENT_KG,
  DEFAULT_WEIGHT_INCREMENT_KG * 2,
  DEFAULT_WEIGHT_INCREMENT_KG * 4,
] as const;

export const RPE_PICKER_VALUES = [5, 6, 7, 8, 9, 10] as const;

export type RpePickerValue = (typeof RPE_PICKER_VALUES)[number];

export const SET_VALUE_UPDATE_DEBOUNCE_MS = 1000;
