import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { usePreventRemove } from "@react-navigation/native";
import { useEffect } from "react";
import { BackHandler, Platform } from "react-native";

import type { SetType } from "@/domain/domain.types";
import type { WorkoutSet } from "@/domain/workout/workout.types";

import { isOperationPending } from "@/features/workout/session/workoutSession.selectors";
import type {
  ActiveWorkoutOperation,
  OperationState,
} from "@/features/workout/session/workoutSession.types";
import {
  RpePickerPanel,
  type RpePickerValue,
} from "@/shared/components/exercise-editor/RpePickerPanel";
import { SetEditorDock } from "@/shared/components/exercise-editor/SetEditorDock";
import { isRepsKeypadPanel } from "@/shared/components/exercise-editor/setEditorPanel.types.utils";
import { SetTypePickerPanel } from "@/shared/components/exercise-editor/SetTypePickerPanel";
import { Button } from "@/shared/components/ui/Button";
import { EditorOptionButton } from "@/shared/components/ui/EditorOptionButton";
import {
  InteractiveKeypad,
  type InteractiveKeypadKey,
} from "@/shared/components/ui/InteractiveKeypad";

import { getPanelLabel } from "../../activeWorkout.viewState.utils";

import type { ActiveSetEditorPanel } from "./activeWorkoutDock.types";
import {
  isActiveSetEditorKeypadPanel,
  isWeightKeypadPanel,
} from "./activeWorkoutDock.types.utils";
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

  usePreventRemove(keypadOpen, () => {
    void onToggleKeypad();
  });

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
    <SetEditorDock
      exerciseName={exerciseName}
      setNumber={activeSet.setIndex + 1}
      setCount={setCount}
      setType={activeSet.type}
      panelLabel={getPanelLabel(panel)}
      disabled={operationPending}
      onDelete={onDelete}
      onHeightChange={onHeightChange}
      headerAction={
        showKeypadControl ? (
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
        ) : null
      }
      footer={
        !keypadOpen ? (
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
        ) : null
      }
    >
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
    </SetEditorDock>
  );
}
