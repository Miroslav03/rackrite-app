import type { SetType } from "@/domain/domain.types";

import { colors } from "@/shared/theme/tokens";

export const SET_TYPE_CONFIG = {
  warmup: {
    label: "Warm-up",
    accentColor: "#e3a456",
    tintColor: "#1F1A13",
  },
  working: {
    label: "Working",
    accentColor: colors.primarySoft,
    tintColor: "#13161F",
  },
  top: {
    label: "Top Set",
    accentColor: "#d9646f",
    tintColor: "#1F1314",
  },
  backoff: {
    label: "Backoff",
    accentColor: "#5fa9a2",
    tintColor: "#131F1E",
  },
} as const;

const SET_TYPE_ORDER = ["warmup", "working", "top", "backoff"] as const;

export const SET_TYPE_OPTIONS: ReadonlyArray<{
  label: string;
  value: SetType;
}> = SET_TYPE_ORDER.map((value) => ({
  label: SET_TYPE_CONFIG[value].label,
  value,
}));

export const WEIGHT_INCREMENTS = [2.5, 5, 10] as const;

export const RPE_PICKER_VALUES = [5, 6, 7, 8, 9, 10] as const;

export type RpePickerValue = (typeof RPE_PICKER_VALUES)[number];

export const SET_VALUE_UPDATE_DEBOUNCE_MS = 1000;
