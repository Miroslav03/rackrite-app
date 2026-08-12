import { Ionicons } from "@expo/vector-icons";

import { Pressable, View, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { SetType } from "@/domain/domain.types";
import type { WorkoutSet } from "@/domain/workout/workout.types";

import { isOperationPending } from "@/features/workout/session/workoutSession.selectors";
import type {
  ActiveWorkoutOperation,
  OperationState,
} from "@/features/workout/session/workoutSession.types";

import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";
import { colors, spacing } from "@/shared/theme/tokens";

import { getPanelLabel } from "../../activeWorkout.viewState.utils";

import type {
  ActiveSetEditorPanel,
  RpePickerValue,
  WeightKeypadKey,
} from "./activeSetEditor.types";
import { isWeightKeypadPanel } from "./activeSetEditor.utils";
import { RpePickerPanel } from "./RpePickerPanel";
import { SetTypePickerPanel } from "./SetTypePickerPanel";
import { WeightNumericKeypad } from "./WeightNumericKeypad";
import { WeightQuickAdjustPanel } from "./WeightQuickAdjustPanel";

type ActiveSetEditorDockProps = {
  exerciseName: string;
  activeSet: WorkoutSet;
  setCount: number;
  panel: ActiveSetEditorPanel;
  operation: OperationState<ActiveWorkoutOperation>;
  onAdjustWeight: (increment: number) => void;
  onToggleWeightKeypad: () => void;
  onPressWeightKey: (key: WeightKeypadKey) => void;
  onSelectRpe: (rpe: RpePickerValue | null) => void;
  onSelectSetType: (setType: SetType) => void;
  onComplete: () => void;
  onHeightChange: (height: number) => void;
};

export function ActiveSetEditorDock({
  exerciseName,
  activeSet,
  setCount,
  panel,
  operation,
  onAdjustWeight,
  onToggleWeightKeypad,
  onPressWeightKey,
  onSelectRpe,
  onSelectSetType,
  onComplete,
  onHeightChange,
}: ActiveSetEditorDockProps) {
  const insets = useSafeAreaInsets();

  const operationPending = isOperationPending(operation);
  const weightKeypadOpen = isWeightKeypadPanel(panel);

  const canComplete = activeSet.weight !== null && activeSet.reps !== null;
  const completePending =
    operationPending && operation.operation.type === "completeSet";
  const weightPanelActive = panel.type === "weight" || weightKeypadOpen;

  function handleLayout(event: LayoutChangeEvent) {
    onHeightChange(event.nativeEvent.layout.height);
  }

  return (
    <View
      accessibilityLabel={`Set editor for ${exerciseName}, set ${activeSet.setIndex + 1}`}
      className="absolute inset-x-0 bottom-0 z-20 border-t border-outline bg-surface px-screenX pt-md"
      style={{
        elevation: 16,
        paddingBottom: Math.max(insets.bottom, spacing.lg),
      }}
      onLayout={handleLayout}
    >
      <View className="mb-md flex-row items-center justify-between gap-md">
        <View className="flex-1">
          <AppText variant="title" className="text-[14px]" numberOfLines={1}>
            {exerciseName}
          </AppText>
          <AppText variant="sectionLabel" className="mt-xs">
            Set {activeSet.setIndex + 1} of {setCount}
          </AppText>
        </View>

        <View className="flex-row items-center gap-md">
          <View className="items-end">
            <AppText variant="sectionLabel">Editing</AppText>
            <AppText className="text-sm font-black text-primarySoft">
              {getPanelLabel(panel)}
            </AppText>
          </View>

          {weightPanelActive ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                weightKeypadOpen
                  ? "Save weight and close numeric keypad"
                  : "Open numeric weight keypad"
              }
              accessibilityHint={
                weightKeypadOpen
                  ? "Saves the entered weight"
                  : "Allows direct weight entry without the device keyboard"
              }
              accessibilityState={{
                disabled: operationPending,
                expanded: weightKeypadOpen,
              }}
              disabled={operationPending}
              hitSlop={4}
              className="h-11 w-11 items-center justify-center rounded-full bg-surfaceHigh"
              onPress={onToggleWeightKeypad}
            >
              <Ionicons
                name={weightKeypadOpen ? "chevron-down" : "keypad-outline"}
                size={20}
                color={colors.primarySoft}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View className="mb-md">
        {panel.type === "weight" ? (
          <WeightQuickAdjustPanel
            disabled={operationPending}
            onAdjust={onAdjustWeight}
          />
        ) : weightKeypadOpen ? (
          <WeightNumericKeypad
            disabled={operationPending}
            onPress={onPressWeightKey}
          />
        ) : panel.type === "rpe" ? (
          <RpePickerPanel
            rpe={activeSet.rpe}
            disabled={operationPending}
            onSelect={onSelectRpe}
          />
        ) : (
          <SetTypePickerPanel
            setType={activeSet.type}
            disabled={operationPending}
            onSelect={onSelectSetType}
          />
        )}
      </View>

      <Button
        title={completePending ? "Completing..." : "Done"}
        size="md"
        disabled={!canComplete || operationPending || weightKeypadOpen}
        dimWhenDisabled={!canComplete || completePending || weightKeypadOpen}
        accessibilityRole="button"
        accessibilityLabel={`Complete set ${activeSet.setIndex + 1}`}
        accessibilityHint={
          canComplete
            ? weightKeypadOpen
              ? "Save the entered weight before completing this set"
              : "Marks this set as complete"
            : "Weight and reps are required before completing this set"
        }
        accessibilityState={{
          disabled: !canComplete || operationPending || weightKeypadOpen,
          busy: completePending,
        }}
        leftIcon={
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={colors.foreground}
          />
        }
        onPress={onComplete}
      />
    </View>
  );
}
