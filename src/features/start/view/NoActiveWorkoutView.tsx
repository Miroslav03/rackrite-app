import { Ionicons } from "@expo/vector-icons";

import { ActivityIndicator } from "react-native";

import { Screen } from "@/shared/components/layout/Screen";
import { ScreenHeader } from "@/shared/components/layout/ScreenHeader";
import { ScreenSection } from "@/shared/components/layout/ScreenSection";
import { Button } from "@/shared/components/ui/Button";
import { colors } from "@/shared/theme/tokens";

import type { StartEmptyWorkoutViewState } from "./startScreen.viewState";
import { StartWorkoutErrorNotifier } from "./StartWorkoutErrorNotifier";

type NoActiveWorkoutViewProps = {
  startEmptyWorkout: StartEmptyWorkoutViewState;
  onStartFromTemplate: () => void;
  onStartEmptyWorkout: () => Promise<void>;
  onOperationErrorDismissed: (error: Error) => void;
};

export function NoActiveWorkoutView({
  startEmptyWorkout,
  onStartFromTemplate,
  onStartEmptyWorkout,
  onOperationErrorDismissed,
}: NoActiveWorkoutViewProps) {
  const isStarting = startEmptyWorkout.status === "starting";

  return (
    <Screen>
      <ScreenHeader
        title="Start Workout"
        subtitle="Training Session Launcher"
      />

      <ScreenSection title="Start Options" className="mt-auto pt-8">
        <Button
          accessibilityLabel="Start a workout from a template"
          leftIcon={
            <Ionicons
              name="copy-outline"
              size={22}
              color={colors.primarySoft}
            />
          }
          onPress={onStartFromTemplate}
          title="Start With Template"
          variant="outline"
          intent="neutral"
          size="lg"
        />

        <Button
          accessibilityLabel="Quick start an empty workout"
          accessibilityState={{ disabled: isStarting, busy: isStarting }}
          disabled={isStarting}
          leftIcon={
            isStarting ? (
              <ActivityIndicator color={colors.muted} size="small" />
            ) : undefined
          }
          onPress={onStartEmptyWorkout}
          title={isStarting ? "Starting..." : "Quick Start (Empty)"}
          variant="ghost"
          intent="neutral"
          size="md"
        />
      </ScreenSection>

      <StartWorkoutErrorNotifier
        operation={startEmptyWorkout}
        onErrorDismissed={onOperationErrorDismissed}
      />
    </Screen>
  );
}
