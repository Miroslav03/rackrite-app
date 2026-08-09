import { Ionicons } from "@expo/vector-icons";

import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/shared/components/ui/AppText";
import { colors, spacing } from "@/shared/theme/tokens";

const DEFAULT_DURATION_MS = 5_000;
const ANIMATION_DURATION_MS = 200;

type ToastNotificationProps = {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
};

export function ToastNotification({
  message,
  onDismiss,
  durationMs = DEFAULT_DURATION_MS,
}: ToastNotificationProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const showAnimation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: ANIMATION_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIMATION_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    showAnimation.start();

    const dismissTimeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: ANIMATION_DURATION_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 12,
          duration: ANIMATION_DURATION_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          onDismissRef.current();
        }
      });
    }, durationMs);

    return () => {
      clearTimeout(dismissTimeout);
      showAnimation.stop();
      opacity.stopAnimation();
      translateY.stopAnimation();
    };
  }, [durationMs, opacity, translateY]);

  return (
    <View
      className="absolute inset-0 z-50 items-center justify-end px-screenX"
      pointerEvents="box-none"
      style={{ paddingBottom: Math.max(insets.bottom, spacing.lg) }}
    >
      <Animated.View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        className="w-full max-w-[520px] flex-row items-center gap-md rounded-card bg-surface px-lg py-md shadow-xl shadow-black/35"
        pointerEvents="none"
        style={{
          opacity,
          transform: [{ translateY }],
        }}
      >
        <Ionicons name="alert-circle-outline" size={22} color={colors.error} />

        <AppText variant="body" className="flex-1 text-foreground">
          {message}
        </AppText>
      </Animated.View>
    </View>
  );
}
