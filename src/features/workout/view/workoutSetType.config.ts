import type { SetType } from "@/domain/domain.types";

import { colors } from "@/shared/theme/tokens";

export const SET_TYPE_LABEL_COLORS: Record<SetType, string> = {
  warmup: "#e3a456",
  top: "#d9646f",
  working: colors.primarySoft,
  backoff: "#5fa9a2",
};

export const SET_TYPE_TINT_COLORS: Record<SetType, string> = {
  warmup: "#1F1A13",
  top: "#1F1314",
  working: "#13161F",
  backoff: "#131F1E",
};
