import { View } from "react-native";

import type { SetType } from "@/domain/domain.types";
import { SET_TYPE_CONFIG } from "@/shared/theme/setTypes";
import { colors } from "@/shared/theme/tokens";

import { AppText } from "./AppText";

export type BadgeTone = "neutral" | "highlight" | SetType;

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  accentColor?: string;
  tintColor?: string;
};

export function Badge({
  label,
  tone = "neutral",
  accentColor,
  tintColor,
}: BadgeProps) {
  const appearance =
    tone === "neutral" || tone === "highlight"
      ? {
          accentColor: tone === "highlight" ? colors.primarySoft : colors.muted,
          tintColor: colors.surfaceHigh,
        }
      : SET_TYPE_CONFIG[tone];

  return (
    <View
      className="max-w-full self-start rounded px-sm"
      style={{
        backgroundColor: tintColor ?? appearance.tintColor,
      }}
    >
      <AppText
        className="text-sm font-bold"
        style={{
          color: accentColor ?? appearance.accentColor,
          fontVariant: ["tabular-nums"],
        }}
      >
        {label}
      </AppText>
    </View>
  );
}
