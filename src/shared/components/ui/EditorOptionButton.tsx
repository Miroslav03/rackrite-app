import type { ReactNode } from "react";

import { Pressable } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { cn } from "@/shared/utils/cn";

import { AppText } from "./AppText";

type EditorOptionButtonProps = {
  label: string;
  accessibilityLabel: string;
  icon?: ReactNode;
  selected?: boolean;
  selectedBackgroundColor?: string;
  selectedForegroundColor?: string;
  hoverBackgroundColor?: string;
  disabled?: boolean;
  className?: string;
  onPress: () => void;
};

export function EditorOptionButton({
  label,
  accessibilityLabel,
  icon,
  selected = false,
  selectedBackgroundColor,
  selectedForegroundColor,
  hoverBackgroundColor,
  disabled = false,
  className,
  onPress,
}: EditorOptionButtonProps) {
  const pressProgress = useSharedValue(0);
  const hoverProgress = useSharedValue(0);
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(pressProgress.value, [0, 1], [1, 0.97]),
      },
    ],
  }));
  const interactionOverlayStyle = useAnimatedStyle(() => ({
    opacity: Math.max(pressProgress.value, hoverProgress.value),
  }));

  function handlePressIn() {
    pressProgress.value = withTiming(1, { duration: 90 });
  }

  function handlePressOut() {
    pressProgress.value = withTiming(0, { duration: 100 });
  }

  function handleHoverIn() {
    hoverProgress.value = withTiming(1, { duration: 120 });
  }

  function handleHoverOut() {
    hoverProgress.value = withTiming(0, { duration: 100 });
  }

  return (
    <Animated.View
      className={cn("overflow-hidden rounded-button", className)}
      style={buttonStyle}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled, selected }}
        disabled={disabled}
        className={cn(
          "min-h-12 items-center justify-center rounded-button border border-transparent bg-surfaceHigh px-sm",
          selected && !selectedBackgroundColor && "bg-primary",
        )}
        style={
          selected && selectedBackgroundColor
            ? { backgroundColor: selectedBackgroundColor }
            : undefined
        }
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {!selected ? (
          <Animated.View
            pointerEvents="none"
            className={cn(
              "absolute inset-0 rounded-button",
              !hoverBackgroundColor && "bg-primary",
            )}
            style={[
              interactionOverlayStyle,
              hoverBackgroundColor
                ? { backgroundColor: hoverBackgroundColor }
                : undefined,
            ]}
          />
        ) : null}

        {icon ?? (
          <AppText
            variant="button"
            className={cn(
              "relative z-10 text-sm",
              selected && !selectedForegroundColor && "text-white",
            )}
            style={
              selected && selectedForegroundColor
                ? { color: selectedForegroundColor }
                : undefined
            }
          >
            {label}
          </AppText>
        )}
      </Pressable>
    </Animated.View>
  );
}
