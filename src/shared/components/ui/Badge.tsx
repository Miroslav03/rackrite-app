import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { cn } from "@/shared/utils/cn";

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
  className?: string;
  textClassName?: string;
  leadingAccessory?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Badge({
  label,
  tone = "neutral",
  accentColor,
  tintColor,
  className,
  textClassName,
  leadingAccessory,
  style,
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
      className={cn(
        "max-w-full self-start rounded px-sm",
        leadingAccessory && "flex-row items-center gap-1",
        className,
      )}
      style={[
        {
          backgroundColor: tintColor ?? appearance.tintColor,
        },
        style,
      ]}
    >
      {leadingAccessory}
      <AppText
        className={cn("text-sm font-bold", textClassName)}
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
