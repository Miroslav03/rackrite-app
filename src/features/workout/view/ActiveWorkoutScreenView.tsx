import { Ionicons } from "@expo/vector-icons";

import { useState } from "react";
import { View } from "react-native";

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
import type { RemoveExerciseCommand } from "@/features/workout/actions/removeExercise";
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
import { DangerModal } from "@/shared/components/ui/DangerModal";
import { useElapsedTime } from "@/shared/hooks/useElapsedTime";
import { colors } from "@/shared/theme/tokens";

import {
  getAddExerciseOperation,
  getDangerConfirmationContent,
  getDangerOperation,
  isRemoveExerciseConfirmation,
} from "./activeWorkout.viewState.utils";
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
  const [activeOverlay, setActiveOverlay] =
    useState<ActiveWorkoutOverlay>(NO_ACTIVE_OVERLAY);

  const timeElapsed = useElapsedTime(workout.workout.startedAt);

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

  function handleAddSet(workoutExerciseId: WorkoutExerciseId) {
    void actions.addSet({ workoutExerciseId });
  }

  function handleExerciseOptionSelected(option: WorkoutExerciseOption) {
    if (activeOverlay.type !== "exerciseOptions") {
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
        return;
    }
  }

  return (
    <>
      <Screen>
        <ScreenHeader
          title="New Workout"
          subtitle={`${workout.workout.status} workout`.toUpperCase()}
          rightAccessory={<HeaderMetric value={timeElapsed} label="Duration" />}
        />

        <ScreenSection>
          <RestTimerCard time="12:22" />
        </ScreenSection>

        {workout.exercises.length === 0 ? (
          <ScreenSection>
            <AppText variant="subtitle">
              Add an exercise to begin your workout.
            </AppText>
          </ScreenSection>
        ) : (
          <View>
            {workout.exercises.map((exerciseAggregate) => (
              <WorkoutExerciseSection
                key={exerciseAggregate.workoutExercise.id}
                exerciseAggregate={exerciseAggregate}
                activeSetId={workout.workout.activeSetId}
                operation={operation}
                exerciseActions={{
                  openOptions: openExerciseOptions,
                  addSet: handleAddSet,
                }}
              />
            ))}
          </View>
        )}

        <ScreenSection className="mt-auto pt-8 pb-4">
          <Button
            title="Add Exercise"
            variant="solid"
            intent="primary"
            size="lg"
            leftIcon={
              <Ionicons
                name="barbell-outline"
                size={18}
                color={colors.foreground}
              />
            }
            onPress={openExercisePicker}
          />
        </ScreenSection>
      </Screen>

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
