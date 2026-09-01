import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "expo-router";

import { useState } from "react";
import { ScrollView, View } from "react-native";

import type { Exercise, ExerciseKind } from "@/domain/exercises/exercise.types";
import { getWorkoutExerciseById } from "@/domain/workout/workout.selectors";
import type {
  WorkoutAggregate,
  WorkoutExerciseId,
  WorkoutSetId,
} from "@/domain/workout/workout.types";

import { ExercisePickerSheet } from "@/features/exercises/view/components/ExercisePickerSheet";
import type { AddExerciseCommand } from "@/features/workout/actions/addExercise";
import type { AddSetCommand } from "@/features/workout/actions/addSet";
import type { AdjustRestTimerCommand } from "@/features/workout/actions/adjustRestTimer";
import type { CompleteSetCommand } from "@/features/workout/actions/completeSet";
import type { RemoveExerciseCommand } from "@/features/workout/actions/removeExercise";
import type { RemoveSetCommand } from "@/features/workout/actions/removeSet";
import type { SelectSetCommand } from "@/features/workout/actions/selectSet";
import type { UndoSetCompletionCommand } from "@/features/workout/actions/undoCompletedSet";
import type { UpdateSetCommand } from "@/features/workout/actions/updateSet";
import { isOperationPending } from "@/features/workout/session/workoutSession.selectors";
import type {
  ActiveWorkoutOperation,
  OperationState,
  WorkoutSessionResult,
} from "@/features/workout/session/workoutSession.types";

import { HeaderMetric } from "@/shared/components/layout/HeaderMetric";
import { Screen } from "@/shared/components/layout/Screen";
import { ScreenHeader } from "@/shared/components/layout/ScreenHeader";
import { ScreenSection } from "@/shared/components/layout/ScreenSection";
import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";
import { CountdownTimer } from "@/shared/components/ui/CountdownTimer";
import { DangerModal } from "@/shared/components/ui/DangerModal";
import { ElapsedTimer } from "@/shared/components/ui/ElapsedTimer";
import { colors, spacing } from "@/shared/theme/tokens";

import {
  getAddExerciseOperation,
  getDangerConfirmationContent,
  getDangerOperation,
  isRemoveExerciseConfirmation,
  isRemoveSetConfirmation,
} from "./activeWorkout.viewState.utils";
import { ActiveSetEditorDock } from "./components/ActiveWorkoutDock/ActiveSetEditorDock";
import { RestTimerDock } from "./components/ActiveWorkoutDock/RestTimerDock";
import { useActiveWorkoutDockEditor } from "./components/ActiveWorkoutDock/useActiveWorkoutDockEditor";
import { ActiveWorkoutOperationErrorNotifier } from "./components/ActiveWorkoutOperationErrorNotifier";
import { RestTimerCard } from "./components/RestTimerCard";
import {
  WorkoutExerciseOptionsSheet,
  type WorkoutExerciseOption,
} from "./components/WorkoutExerciseOptionsSheet";
import { WorkoutExerciseSection } from "./components/WorkoutExerciseSection";

export type ActiveWorkoutScreenActions = {
  dismissOperationError: (error: Error) => void;
  addExercise: (
    command: AddExerciseCommand,
  ) => Promise<WorkoutSessionResult<WorkoutAggregate>>;
  removeExercise: (
    command: RemoveExerciseCommand,
  ) => Promise<WorkoutSessionResult<WorkoutAggregate>>;
  addSet: (
    command: AddSetCommand,
  ) => Promise<WorkoutSessionResult<WorkoutAggregate>>;
  updateSet: (
    command: UpdateSetCommand,
  ) => Promise<WorkoutSessionResult<WorkoutAggregate>>;
  selectSet: (
    command: SelectSetCommand,
  ) => Promise<WorkoutSessionResult<WorkoutAggregate>>;
  completeSet: (
    command: CompleteSetCommand,
  ) => Promise<WorkoutSessionResult<WorkoutAggregate>>;
  removeSet: (
    command: RemoveSetCommand,
  ) => Promise<WorkoutSessionResult<WorkoutAggregate>>;
  undoCompletedSet: (
    command: UndoSetCompletionCommand,
  ) => Promise<WorkoutSessionResult<WorkoutAggregate>>;
  adjustRestTimer: (
    command: AdjustRestTimerCommand,
  ) => Promise<WorkoutSessionResult<WorkoutAggregate>>;
  skipRestTimer: () => Promise<WorkoutSessionResult<WorkoutAggregate>>;
  resetRestTimer: () => Promise<WorkoutSessionResult<WorkoutAggregate>>;
};

type ActiveWorkoutScreenViewProps = {
  workout: WorkoutAggregate;
  operation: OperationState<ActiveWorkoutOperation>;
  actions: ActiveWorkoutScreenActions;
};

export type DangerConfirmationModal =
  | {
      action: "removeExercise";
      workoutExerciseId: WorkoutExerciseId;
    }
  | {
      action: "removeSet";
      workoutSetId: WorkoutSetId;
    };

export type ActiveWorkoutOverlay =
  | { type: "none" }
  | { type: "exercisePicker" }
  | {
      type: "exerciseOptions";
      workoutExerciseId: WorkoutExerciseId;
    }
  | {
      type: "dangerConfirmationModal";
      confirmation: DangerConfirmationModal;
    };

const NO_ACTIVE_OVERLAY: ActiveWorkoutOverlay = { type: "none" };

export function ActiveWorkoutScreenView({
  workout,
  operation,
  actions,
}: ActiveWorkoutScreenViewProps) {
  const [activeDockHeight, setActiveDockHeight] = useState(0);
  const [activeOverlay, setActiveOverlay] =
    useState<ActiveWorkoutOverlay>(NO_ACTIVE_OVERLAY);

  const isFocused = useIsFocused();
  const activeDockEditor = useActiveWorkoutDockEditor(workout, actions);

  const operationPending = isOperationPending(operation);

  const restTimer = workout.workout.restTimer;
  const editorActiveSet = activeDockEditor.activeSet;
  const editorActiveExercise = activeDockEditor.activeExercise;

  const activeSetPanel =
    activeDockEditor.panel.type === "restTimer" ? null : activeDockEditor.panel;
  const restTimerDockOpen =
    activeDockEditor.panel.type === "restTimer" && restTimer !== null;

  const excludedExerciseIds = workout.exercises.map(
    ({ exercise }) => exercise.id,
  );

  const usedCompetitionFamilies = new Set(
    workout.exercises
      .map(({ exercise }) => exercise)
      .filter((exercise) => exercise.kind === "competition_lift")
      .map((exercise) => exercise.liftFamily),
  );

  const excludedExerciseKinds: ExerciseKind[] =
    usedCompetitionFamilies.size === 3 ? ["competition_lift"] : [];

  const optionsExercise =
    activeOverlay.type === "exerciseOptions"
      ? (getWorkoutExerciseById(workout, activeOverlay.workoutExerciseId) ??
        null)
      : null;

  const dangerOverlay =
    activeOverlay.type === "dangerConfirmationModal" ? activeOverlay : null;

  const dangerContent = dangerOverlay
    ? getDangerConfirmationContent(workout, dangerOverlay.confirmation)
    : null;

  const dangerOperation = getDangerOperation(activeOverlay, operation);
  const addExerciseOperation = getAddExerciseOperation(
    activeOverlay,
    operation,
  );

  function closeOverlay() {
    setActiveOverlay(NO_ACTIVE_OVERLAY);
  }

  function openExercisePicker() {
    setActiveOverlay({ type: "exercisePicker" });
  }

  function openExerciseOptions(workoutExerciseId: WorkoutExerciseId) {
    setActiveOverlay({ type: "exerciseOptions", workoutExerciseId });
  }

  async function handleExerciseSelected(exercise: Exercise) {
    const result = await actions.addExercise({ exercise });

    if (!result.success) {
      return;
    }

    setActiveOverlay((currentOverlay) => {
      return currentOverlay.type === "exercisePicker"
        ? NO_ACTIVE_OVERLAY
        : currentOverlay;
    });
  }

  async function handleRemoveExercise(workoutExerciseId: WorkoutExerciseId) {
    const result = await actions.removeExercise({ workoutExerciseId });

    if (!result.success) {
      return;
    }

    setActiveOverlay((currentOverlay) => {
      return isRemoveExerciseConfirmation(currentOverlay, workoutExerciseId)
        ? NO_ACTIVE_OVERLAY
        : currentOverlay;
    });
  }

  async function openRemoveSetConfirmation(workoutSetId: WorkoutSetId) {
    if (!(await activeDockEditor.savePendingKeypadUpdate())) {
      return;
    }

    setActiveOverlay({
      type: "dangerConfirmationModal",
      confirmation: {
        action: "removeSet",
        workoutSetId,
      },
    });
  }

  async function handleRemoveSet(workoutSetId: WorkoutSetId) {
    const result = await actions.removeSet({ workoutSetId });

    if (!result.success) {
      return;
    }

    setActiveOverlay((currentOverlay) => {
      return isRemoveSetConfirmation(currentOverlay, workoutSetId)
        ? NO_ACTIVE_OVERLAY
        : currentOverlay;
    });
  }

  function handleAddSet(workoutExerciseId: WorkoutExerciseId) {
    void actions.addSet({ workoutExerciseId });
  }

  async function handleExerciseOptionSelected(option: WorkoutExerciseOption) {
    if (activeOverlay.type !== "exerciseOptions") {
      return;
    }

    if (!(await activeDockEditor.savePendingKeypadUpdate())) {
      return;
    }

    switch (option) {
      case "removeExercise":
        setActiveOverlay({
          type: "dangerConfirmationModal",
          confirmation: {
            action: "removeExercise",
            workoutExerciseId: activeOverlay.workoutExerciseId,
          },
        });
        return;
    }
  }

  function handleDangerConfirmation() {
    if (activeOverlay.type !== "dangerConfirmationModal") {
      return;
    }

    switch (activeOverlay.confirmation.action) {
      case "removeExercise":
        void handleRemoveExercise(activeOverlay.confirmation.workoutExerciseId);
        return;

      case "removeSet":
        void handleRemoveSet(activeOverlay.confirmation.workoutSetId);
        return;
    }
  }

  return (
    <>
      <Screen
        scroll={false}
        className="pt-0"
        headerRightAccessory={
          restTimer ? (
            <CountdownTimer
              endsAt={restTimer.endsAt}
              enabled={isFocused}
              onExpire={() => {
                void activeDockEditor.skipRestTimer();
              }}
            >
              {(value) => (
                <RestTimerCard
                  time={value}
                  disabled={operationPending}
                  onPress={() => {
                    void activeDockEditor.openRestTimerDock(restTimer);
                  }}
                />
              )}
            </CountdownTimer>
          ) : null
        }
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: spacing.xl,
            paddingBottom:
              !restTimerDockOpen && !activeDockEditor.activeSet
                ? 0
                : activeDockHeight,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            title="New Workout"
            subtitle={`${workout.workout.status} workout`.toUpperCase()}
            rightAccessory={
              <ElapsedTimer
                startedAt={workout.workout.startedAt}
                enabled={isFocused}
              >
                {(value) => <HeaderMetric label="Duration" value={value} />}
              </ElapsedTimer>
            }
          />

          {workout.exercises.length === 0 ? (
            <ScreenSection>
              <AppText variant="subtitle">
                Add an exercise to begin your workout.
              </AppText>
            </ScreenSection>
          ) : (
            <View className="mt-2">
              {workout.exercises.map((exerciseAggregate) => (
                <WorkoutExerciseSection
                  key={exerciseAggregate.workoutExercise.id}
                  exerciseAggregate={exerciseAggregate}
                  activeSetId={
                    activeDockEditor.activeSet?.id ??
                    workout.workout.activeSetId
                  }
                  activeSetField={activeSetPanel?.type}
                  weightDraft={activeDockEditor.weightDraft}
                  repsDraft={activeDockEditor.repsDraft}
                  operation={operation}
                  exerciseActions={{
                    openOptions: openExerciseOptions,
                    addSet: handleAddSet,
                    openSetEditor: activeDockEditor.openSetEditor,
                  }}
                />
              ))}
            </View>
          )}

          <ScreenSection className="relative z-30 mt-auto pt-8 pb-4">
            <Button
              title="Add Exercise"
              variant="ghost"
              intent="neutral"
              size="md"
              accessibilityRole="button"
              leftIcon={
                <Ionicons
                  name="barbell-outline"
                  size={18}
                  color={colors.foreground}
                />
              }
              onPress={openExercisePicker}
            />
            <Button
              title="Finish Workout"
              variant="ghost"
              intent="primary"
              size="lg"
              accessibilityRole="button"
              leftIcon={
                <Ionicons name="trophy" size={18} color={colors.primarySoft} />
              }
              textClassName="color-primarySoft"
              onPress={() => {}}
            />
            <Button
              title="Cancel Workout"
              variant="ghost"
              intent="danger"
              size="md"
              accessibilityRole="button"
              leftIcon={
                <Ionicons name="close-outline" size={18} color={colors.error} />
              }
              onPress={() => {}}
            />
          </ScreenSection>
        </ScrollView>
      </Screen>

      {restTimerDockOpen && restTimer ? (
        <RestTimerDock
          endsAt={restTimer.endsAt}
          enabled={isFocused}
          operation={operation}
          onAdjust={activeDockEditor.adjustRestTimer}
          onReset={activeDockEditor.resetRestTimer}
          onSkip={activeDockEditor.skipRestTimer}
          onDismiss={activeDockEditor.closeRestTimerDock}
          onHeightChange={setActiveDockHeight}
        />
      ) : activeSetPanel && editorActiveSet && editorActiveExercise ? (
        <ActiveSetEditorDock
          exerciseName={editorActiveExercise.exercise.name}
          activeSet={editorActiveSet}
          setCount={editorActiveExercise.sets.length}
          panel={activeSetPanel}
          operation={operation}
          onAdjustWeight={activeDockEditor.adjustWeight}
          onToggleKeypad={activeDockEditor.toggleKeypad}
          onPressWeightKey={activeDockEditor.pressWeightKey}
          onPressRepsKey={activeDockEditor.pressRepsKey}
          onSelectRpe={activeDockEditor.selectRpe}
          onSelectSetType={activeDockEditor.selectSetType}
          onComplete={activeDockEditor.completeSet}
          onUndoCompletion={activeDockEditor.undoCompletedSet}
          onDelete={() => {
            void openRemoveSetConfirmation(editorActiveSet.id);
          }}
          onHeightChange={setActiveDockHeight}
        />
      ) : null}

      <ActiveWorkoutOperationErrorNotifier
        operation={operation}
        onErrorDismissed={actions.dismissOperationError}
      />

      <ExercisePickerSheet
        open={activeOverlay.type === "exercisePicker"}
        excludedExerciseIds={excludedExerciseIds}
        selectionOperation={addExerciseOperation}
        onSelect={(exercise) => {
          void handleExerciseSelected(exercise);
        }}
        excludedKinds={excludedExerciseKinds}
        onClose={closeOverlay}
      />

      {optionsExercise !== null && (
        <WorkoutExerciseOptionsSheet
          exerciseName={optionsExercise.exercise.name}
          onOptionSelect={handleExerciseOptionSelected}
          onClose={closeOverlay}
        />
      )}

      {dangerContent !== null && (
        <DangerModal
          open
          title={dangerContent.title}
          description={dangerContent.description}
          confirmLabel={dangerContent.confirmLabel}
          operation={dangerOperation}
          onConfirm={handleDangerConfirmation}
          onClose={closeOverlay}
        />
      )}
    </>
  );
}
