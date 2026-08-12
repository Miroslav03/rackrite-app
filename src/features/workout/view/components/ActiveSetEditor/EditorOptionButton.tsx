import type { ReactNode } from "react";

import { Pressable } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { AppText } from "@/shared/components/ui/AppText";
import { cn } from "@/shared/utils/cn";

type EditorOptionButtonProps = {
  label: string;
  accessibilityLabel: string;
  icon?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  onPress: () => void;
};

export function EditorOptionButton({
  label,
  accessibilityLabel,
  icon,
  selected = false,
  disabled = false,
  className,
  onPress,
}: EditorOptionButtonProps) {
  const pressProgress = useSharedValue(0);
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(pressProgress.value, [0, 1], [1, 0.97]),
      },
    ],
  }));
  const primaryOverlayStyle = useAnimatedStyle(() => ({
    opacity: pressProgress.value,
  }));

  function handlePressIn() {
    pressProgress.value = withTiming(1, { duration: 90 });
  }

  function handlePressOut() {
    pressProgress.value = withTiming(0, { duration: 100 });
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
          selected && "bg-primary",
        )}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {!selected ? (
          <Animated.View
            pointerEvents="none"
            className="absolute inset-0 rounded-button bg-primary"
            style={primaryOverlayStyle}
          />
        ) : null}

        {icon ?? (
          <AppText
            variant="button"
            className={cn("relative z-10 text-sm", selected && "text-white")}
          >
            {label}
          </AppText>
        )}
      </Pressable>
    </Animated.View>
  );
}
