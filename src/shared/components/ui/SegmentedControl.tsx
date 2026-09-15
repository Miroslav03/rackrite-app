import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { cn } from "@/shared/utils/cn";

import { AppText } from "./AppText";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  accessibilityLabel?: string;
  accessory?: ReactNode;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      className="flex-row gap-1 rounded-xl border border-outline/20 bg-surfacePanel p-1"
    >
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="tab"
          accessibilityLabel={option.accessibilityLabel ?? option.label}
          accessibilityState={{ selected: option.value === value }}
          onPress={() => onChange(option.value)}
          className={cn(
            "flex-1 flex-row flex-wrap items-center justify-center gap-sm rounded-lg px-1 py-2",
            option.value === value && "bg-primary",
          )}
        >
          <AppText
            className={cn(
              "text-center text-sm font-bold uppercase ",
              option.value === value && "text-white font-black",
            )}
          >
            {option.label}
          </AppText>
          {option.accessory}
        </Pressable>
      ))}
    </View>
  );
}
