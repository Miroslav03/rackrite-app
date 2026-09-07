import { Ionicons } from "@expo/vector-icons";
import { usePreventRemove } from "@react-navigation/native";

import { useEffect, useRef } from "react";
import {
  BackHandler,
  Platform,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { RestTimerAdjustmentSeconds } from "@/features/workout/actions/adjustRestTimer";
import { isOperationPending } from "@/features/workout/session/workoutSession.selectors";
import type {
  ActiveWorkoutOperation,
  OperationState,
} from "@/features/workout/session/workoutSession.types";

import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";
import { CountdownTimer } from "@/shared/components/ui/CountdownTimer";
import { EditorOptionButton } from "@/shared/components/ui/EditorOptionButton";
import {
  measureView,
  useScrollVisibility,
} from "@/shared/context/ScrollVisibilityContext";
import { colors, spacing } from "@/shared/theme/tokens";

type RestTimerDockProps = {
  endsAt: number;
  enabled: boolean;
  operation: OperationState<ActiveWorkoutOperation>;
  onAdjust: (seconds: RestTimerAdjustmentSeconds) => void;
  onReset: () => void;
  onSkip: () => void;
  onDismiss: () => void;
  onHeightChange: (height: number) => void;
};

export function RestTimerDock({
  endsAt,
  enabled,
  operation,
  onAdjust,
  onReset,
  onSkip,
  onDismiss,
  onHeightChange,
}: RestTimerDockProps) {
  const dockRef = useRef<View>(null);

  const insets = useSafeAreaInsets();

  const operationPending = isOperationPending(operation);
  const skipPending =
    operation.status === "pending" &&
    operation.operation.type === "skipRestTimer";

  function handleLayout(event: LayoutChangeEvent) {
    onHeightChange(event.nativeEvent.layout.height);
  }
  const { registerOccluder } = useScrollVisibility();

  usePreventRemove(true, onDismiss);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onDismiss();
        return true;
      },
    );

    return () => subscription.remove();
  }, [onDismiss]);

  useEffect(() => {
    return registerOccluder(() => measureView(dockRef.current));
  }, [registerOccluder]);

  return (
    <View
      ref={dockRef}
      accessibilityLabel="Rest timer controls"
      className="absolute inset-x-0 bottom-0 z-20 border-t border-outline bg-surface px-screenX pt-md"
      style={{
        elevation: 16,
        paddingBottom: Math.max(insets.bottom, spacing.lg),
      }}
      onLayout={handleLayout}
    >
      <View className="mb-md flex-row items-center justify-between gap-md">
        <View className="flex-row items-center gap-sm">
          <Ionicons name="timer-outline" size={24} color={colors.primarySoft} />

          <View>
            <AppText variant="title" className="text-[14px]">
              Rest
            </AppText>
            <AppText variant="sectionLabel" className="mt-xs">
              Recovery timer
            </AppText>
          </View>
        </View>

        <CountdownTimer endsAt={endsAt} enabled={enabled}>
          {(value) => (
            <AppText
              variant="title"
              className="text-3xl leading-none tracking-tight"
            >
              {value}
            </AppText>
          )}
        </CountdownTimer>
      </View>

      <View className="mb-md flex-row gap-sm">
        <EditorOptionButton
          label="−15 sec"
          accessibilityLabel="Subtract 15 seconds from rest timer"
          disabled={operationPending}
          className="flex-1"
          onPress={() => onAdjust(-15)}
        />
        <EditorOptionButton
          label="Reset"
          accessibilityLabel="Restart the configured rest duration"
          disabled={operationPending}
          className="flex-1"
          onPress={onReset}
        />
        <EditorOptionButton
          label="+15 sec"
          accessibilityLabel="Add 15 seconds to rest timer"
          disabled={operationPending}
          className="flex-1"
          onPress={() => onAdjust(15)}
        />
      </View>

      <Button
        title={skipPending ? "Skipping..." : "Skip"}
        variant="solid"
        intent="primary"
        size="md"
        disabled={operationPending}
        dimWhenDisabled={skipPending}
        accessibilityRole="button"
        accessibilityLabel="Skip rest timer"
        accessibilityHint="Ends rest and opens the next unfinished set"
        accessibilityState={{ disabled: operationPending, busy: skipPending }}
        onPress={onSkip}
      />
    </View>
  );
}
