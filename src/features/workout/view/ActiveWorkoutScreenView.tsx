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
import { RestTimerCard } from "./components/RestTimerCard";
import {
  WorkoutExerciseOptionsSheet,
  type WorkoutExerciseOption,
} from "./components/WorkoutExerciseOptionsSheet";
import { WorkoutExerciseSection } from "./components/WorkoutExerciseSection";

export type ActiveWorkoutScreenActions = {
  addExercise: (
    command: AddExerciseCommand,
  ) => Promise<WorkoutSessionResult<WorkoutAggregate>>;
  removeExercise: (
    command: RemoveExerciseCommand,
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
  | { type: "exercisePicker"; error: Error | null }
  | {
      type: "exerciseOptions";
      workoutExerciseId: WorkoutExerciseId;
    }
  | {
      type: "dangerConfirmationModal";
      confirmation: DangerConfirmationModal;
      error: Error | null;
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
    setActiveOverlay({ type: "exercisePicker", error: null });
  }

  function openExerciseOptions(workoutExerciseId: WorkoutExerciseId) {
    setActiveOverlay({ type: "exerciseOptions", workoutExerciseId });
  }

  async function handleExerciseSelected(exercise: Exercise) {
    setActiveOverlay((currentOverlay) => {
      return currentOverlay.type === "exercisePicker"
        ? { ...currentOverlay, error: null }
        : currentOverlay;
    });

    const result = await actions.addExercise({ exercise });

    setActiveOverlay((currentOverlay) => {
      if (currentOverlay.type !== "exercisePicker") {
        return currentOverlay;
      }

      return result.success
        ? NO_ACTIVE_OVERLAY
        : { ...currentOverlay, error: result.error };
    });
  }

  async function handleRemoveExercise(workoutExerciseId: WorkoutExerciseId) {
    setActiveOverlay((currentOverlay) => {
      return isRemoveExerciseConfirmation(currentOverlay, workoutExerciseId)
        ? { ...currentOverlay, error: null }
        : currentOverlay;
    });

    const result = await actions.removeExercise({ workoutExerciseId });

    setActiveOverlay((currentOverlay) => {
      if (!isRemoveExerciseConfirmation(currentOverlay, workoutExerciseId)) {
        return currentOverlay;
      }

      return result.success
        ? NO_ACTIVE_OVERLAY
        : { ...currentOverlay, error: result.error };
    });
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
          error: null,
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
                onOpenOptions={() =>
                  openExerciseOptions(exerciseAggregate.workoutExercise.id)
                }
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
