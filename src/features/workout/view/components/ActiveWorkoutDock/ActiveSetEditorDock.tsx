import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { usePreventRemove } from "@react-navigation/native";
import { useEffect, useRef } from "react";
import {
  BackHandler,
  Platform,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { SetType } from "@/domain/domain.types";
import type { WorkoutSet } from "@/domain/workout/workout.types";

import { isOperationPending } from "@/features/workout/session/workoutSession.selectors";
import type {
  ActiveWorkoutOperation,
  OperationState,
} from "@/features/workout/session/workoutSession.types";
import {
  SET_TYPE_CONFIG,
  type RpePickerValue,
} from "@/features/workout/view/activeWorkout.config";

import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";
import { EditorOptionButton } from "@/shared/components/ui/EditorOptionButton";
import {
  InteractiveKeypad,
  type InteractiveKeypadKey,
} from "@/shared/components/ui/InteractiveKeypad";
import { colors, spacing } from "@/shared/theme/tokens";

import { getPanelLabel } from "../../activeWorkout.viewState.utils";

import {
  measureView,
  useScrollVisibility,
} from "@/shared/context/ScrollVisibilityContext";
import type { ActiveSetEditorPanel } from "./activeWorkoutDock.types";
import {
  isActiveSetEditorKeypadPanel,
  isRepsKeypadPanel,
  isWeightKeypadPanel,
} from "./activeWorkoutDock.types.utils";
import { RpePickerPanel } from "./RpePickerPanel";
import { SetTypePickerPanel } from "./SetTypePickerPanel";
import { WeightQuickAdjustPanel } from "./WeightQuickAdjustPanel";

type ActiveSetEditorDockProps = {
  exerciseName: string;
  activeSet: WorkoutSet;
  setCount: number;
  panel: ActiveSetEditorPanel;
  operation: OperationState<ActiveWorkoutOperation>;
  onAdjustWeight: (increment: number) => void;
  onToggleKeypad: () => void;
  onPressWeightKey: (key: InteractiveKeypadKey) => void;
  onPressRepsKey: (key: InteractiveKeypadKey) => void;
  onSelectRpe: (rpe: RpePickerValue | null) => void;
  onSelectSetType: (setType: SetType) => void;
  onComplete: () => void;
  onUndoCompletion: () => void;
  onDelete: () => void;
  onHeightChange: (height: number) => void;
};

export function ActiveSetEditorDock({
  exerciseName,
  activeSet,
  setCount,
  panel,
  operation,
  onAdjustWeight,
  onToggleKeypad,
  onPressWeightKey,
  onPressRepsKey,
  onSelectRpe,
  onSelectSetType,
  onComplete,
  onUndoCompletion,
  onDelete,
  onHeightChange,
}: ActiveSetEditorDockProps) {
  const dockRef = useRef<View>(null);

  const insets = useSafeAreaInsets();
  const { registerOccluder, ensureVisible } = useScrollVisibility();

  const operationPending = isOperationPending(operation);
  const weightKeypadOpen = isWeightKeypadPanel(panel);
  const repsKeypadOpen = isRepsKeypadPanel(panel);
  const keypadOpen = isActiveSetEditorKeypadPanel(panel);

  const keypadInputLabel = repsKeypadOpen ? "reps" : "weight";
  const isCompleted = activeSet.finishedAt !== null;
  const canComplete = activeSet.weight !== null && activeSet.reps !== null;
  const completePending =
    operationPending && operation.operation.type === "completeSet";
  const undoPending =
    operationPending && operation.operation.type === "undoCompletedSet";
  const showKeypadControl = panel.type === "weight" || keypadOpen;

  function handleLayout(event: LayoutChangeEvent) {
    onHeightChange(event.nativeEvent.layout.height);

    requestAnimationFrame(() => {
      void ensureVisible();
    });
  }

  usePreventRemove(keypadOpen, () => {
    void onToggleKeypad();
  });

  useEffect(() => {
    return registerOccluder(() => measureView(dockRef.current));
  }, [registerOccluder]);

  useEffect(() => {
    if (!keypadOpen || Platform.OS !== "android") {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        void onToggleKeypad();
        return true;
      },
    );

    return () => subscription.remove();
  }, [keypadOpen, onToggleKeypad]);

  return (
    <View
      ref={dockRef}
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
            <AppText
              className="text-sm font-black"
              style={{ color: SET_TYPE_CONFIG[activeSet.type].accentColor }}
            >
              {getPanelLabel(panel)}
            </AppText>
          </View>

          <EditorOptionButton
            variant="icon"
            accessibilityLabel={`Remove set ${activeSet.setIndex + 1}`}
            accessibilityHint="Opens a confirmation before removing this set"
            accessibilityState={{ disabled: operationPending }}
            disabled={operationPending}
            hitSlop={4}
            hoverBackgroundColor={colors.errorSolid}
            icon={
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            }
            onPress={onDelete}
          />

          {showKeypadControl ? (
            <EditorOptionButton
              variant="icon"
              accessibilityLabel={
                keypadOpen
                  ? `Save ${keypadInputLabel} and close numeric keypad`
                  : "Open numeric weight keypad"
              }
              accessibilityHint={
                keypadOpen
                  ? `Saves the entered ${keypadInputLabel}`
                  : "Allows direct weight entry without the device keyboard"
              }
              accessibilityState={{
                disabled: operationPending,
                expanded: keypadOpen,
              }}
              disabled={operationPending}
              hitSlop={4}
              icon={
                <Ionicons
                  name={keypadOpen ? "chevron-down" : "keypad-outline"}
                  size={20}
                  color="#fff"
                />
              }
              onPress={onToggleKeypad}
            />
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
          <InteractiveKeypad
            disabled={operationPending}
            allowDecimal
            inputLabel="weight"
            onPress={onPressWeightKey}
          />
        ) : repsKeypadOpen ? (
          <InteractiveKeypad
            disabled={operationPending}
            allowDecimal={false}
            inputLabel="reps"
            onPress={onPressRepsKey}
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

      {!keypadOpen ? (
        <Button
          title={
            isCompleted
              ? undoPending
                ? "Undoing..."
                : "Undo"
              : completePending
                ? "Completing..."
                : "Done"
          }
          variant={isCompleted ? "solid" : "solid"}
          intent={isCompleted ? "neutral" : "primary"}
          size="md"
          disabled={operationPending || (!isCompleted && !canComplete)}
          dimWhenDisabled={
            isCompleted ? undoPending : !canComplete || completePending
          }
          accessibilityRole="button"
          accessibilityLabel={
            isCompleted
              ? `Undo completion of set ${activeSet.setIndex + 1}`
              : `Complete set ${activeSet.setIndex + 1}`
          }
          accessibilityHint={
            isCompleted
              ? "Marks this set as unfinished while preserving its values"
              : canComplete
                ? "Marks this set as complete"
                : "Weight and reps are required before completing this set"
          }
          accessibilityState={{
            disabled: operationPending || (!isCompleted && !canComplete),
            busy: isCompleted ? undoPending : completePending,
          }}
          leftIcon={
            isCompleted ? (
              <Ionicons
                name={isCompleted ? "arrow-undo" : "checkmark"}
                size={16}
                color={"#fff"}
              />
            ) : (
              <MaterialCommunityIcons
                name="check-bold"
                size={18}
                color={"#fff"}
              />
            )
          }
          onPress={isCompleted ? onUndoCompletion : onComplete}
        />
      ) : null}
    </View>
  );
}
