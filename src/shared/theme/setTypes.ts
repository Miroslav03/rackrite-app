import type { SetType } from "@/domain/domain.types";

import { colors } from "./tokens";

export const SET_TYPE_CONFIG = {
  warmup: { label: "Warm-up", accentColor: "#e3a456", tintColor: "#1F1A13" },
  working: {
    label: "Working",
    accentColor: colors.primarySoft,
    tintColor: "#13161F",
  },
  top: { label: "Top Set", accentColor: "#d9646f", tintColor: "#1F1314" },
  backoff: { label: "Backoff", accentColor: "#5fa9a2", tintColor: "#131F1E" },
} as const;

export const SET_TYPE_ORDER = ["warmup", "working", "top", "backoff"] as const;

export const SET_TYPE_OPTIONS: ReadonlyArray<{
  label: string;
  value: SetType;
}> = SET_TYPE_ORDER.map((value) => ({
  label: SET_TYPE_CONFIG[value].label,
  value,
}));
