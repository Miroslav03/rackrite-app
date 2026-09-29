import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { spacing } from "@/shared/theme/tokens";
import { cn } from "@/shared/utils/cn";

export const FLOATING_ACTION_BUTTON_SIZE = 56;

type FloatingActionButtonProps = {
  children: ReactNode;
  accessibilityLabel: string;
  onPress: () => void;
  intent?: "primary" | "neutral";
  testID?: string;
};

export function FloatingActionButton({
  children,
  accessibilityLabel,
  onPress,
  intent = "neutral",
  testID,
}: FloatingActionButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className={cn(
        "items-center justify-center rounded-full border border-outline/30",
        intent === "primary" ? "bg-primary" : "bg-surfaceHigh/80",
      )}
      style={{
        width: FLOATING_ACTION_BUTTON_SIZE,
        height: FLOATING_ACTION_BUTTON_SIZE,
      }}
    >
      {children}
    </Pressable>
  );
}

export function FloatingActionGroup({ children }: { children: ReactNode }) {
  return (
    <View
      className="absolute flex-row gap-md"
      style={{ right: spacing.screenX, bottom: spacing.xl }}
    >
      {children}
    </View>
  );
}
