import { Ionicons } from "@expo/vector-icons";

import { ActivityIndicator, Pressable, View } from "react-native";

import type {
  WorkoutExerciseAggregate,
  WorkoutExerciseId,
  WorkoutSetId,
} from "@/domain/workout/workout.types";

import {
  isAddSetOperationPending,
  isOperationPending,
} from "@/features/workout/session/workoutSession.selectors";
import type {
  ActiveWorkoutOperation,
  OperationState,
} from "@/features/workout/session/workoutSession.types";
import type { ActiveSetEditorPanelType } from "@/features/workout/view/components/ActiveSetEditor/activeSetEditor.types";

import { ScreenSection } from "@/shared/components/layout/ScreenSection";
import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";
import { colors } from "@/shared/theme/tokens";

import { formatExerciseKind } from "@/features/exercises/view/utils/formatExerciseKind";

import { formatSetType } from "../activeWorkout.viewState.utils";

import { WorkoutSetCard } from "./WorkoutSetCard";

export type WorkoutExerciseSectionActions = {
  openOptions: (workoutExerciseId: WorkoutExerciseId) => void;
  addSet: (workoutExerciseId: WorkoutExerciseId) => void;
  openSetEditor: (
    workoutSetId: WorkoutSetId,
    panel: ActiveSetEditorPanelType,
  ) => void;
};

type WorkoutExerciseSectionProps = {
  exerciseAggregate: WorkoutExerciseAggregate;
  activeSetId: WorkoutSetId | null;
  activeSetField: ActiveSetEditorPanelType;
  weightDraft?: string;
  repsDraft?: string;
  operation: OperationState<ActiveWorkoutOperation>;
  exerciseActions: WorkoutExerciseSectionActions;
  className?: string;
};

export function WorkoutExerciseSection({
  exerciseAggregate,
  activeSetId,
  activeSetField,
  weightDraft,
  repsDraft,
  operation,
  exerciseActions,
  className,
}: WorkoutExerciseSectionProps) {
  const { exercise, sets } = exerciseAggregate;
  const workoutExerciseId = exerciseAggregate.workoutExercise.id;

  const addSetPending = isAddSetOperationPending(operation, workoutExerciseId);
  const addSetButtonDisabled = isOperationPending(operation);

  return (
    <ScreenSection className={className}>
      <View className="flex-row items-start justify-between gap-md">
        <View className="flex-1">
          <AppText variant="title" className="text-[22px]">
            {exercise.name}
          </AppText>

          <AppText variant="subtitle">
            {formatExerciseKind(exercise.kind)}
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Options for ${exercise.name}`}
          hitSlop={12}
          onPress={() => exerciseActions.openOptions(workoutExerciseId)}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.muted} />
        </Pressable>
      </View>
      {/* TODO: Should add notes with desgin later here */}

      {sets.map((set) => {
        const status =
          set.finishedAt !== null
            ? "completed"
            : set.id === activeSetId
              ? "active"
              : "pending";

        return (
          <WorkoutSetCard
            key={set.id}
            setIndex={set.setIndex + 1}
            setType={formatSetType(set.type)}
            weight={set.weight}
            weightDraft={activeSetId === set.id ? weightDraft : undefined}
            reps={set.reps}
            repsDraft={activeSetId === set.id ? repsDraft : undefined}
            rpe={set.rpe}
            status={status}
            activeField={activeSetField}
            disabled={isOperationPending(operation) || status === "completed"}
            onSelect={() => exerciseActions.openSetEditor(set.id, "weight")}
            onEditField={(field) =>
              exerciseActions.openSetEditor(set.id, field)
            }
          />
        );
      })}

      <Button
        title={addSetPending ? "Adding..." : "Add Set"}
        variant="ghost"
        intent="neutral"
        size="md"
        disabled={addSetButtonDisabled}
        dimWhenDisabled={addSetPending}
        accessibilityLabel={`Add set to ${exercise.name}`}
        accessibilityState={{
          disabled: addSetButtonDisabled,
          busy: addSetPending,
        }}
        leftIcon={
          addSetPending ? (
            <ActivityIndicator color={colors.muted} size="small" />
          ) : (
            <Ionicons name="add" size={18} color={colors.muted} />
          )
        }
        onPress={() => exerciseActions.addSet(workoutExerciseId)}
      />
    </ScreenSection>
  );
}
