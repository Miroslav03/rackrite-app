import { Ionicons } from "@expo/vector-icons";

import { memo } from "react";
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
import type { ActiveSetEditorPanelType } from "@/features/workout/view/components/ActiveWorkoutDock/activeWorkoutDock.types";

import { ScreenSection } from "@/shared/components/layout/ScreenSection";
import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";
import { colors } from "@/shared/theme/tokens";

import { formatExerciseKind } from "@/features/exercises/view/utils/formatExerciseKind";

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
  activeSetField?: ActiveSetEditorPanelType;
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

      <WorkoutSetList
        sets={sets}
        activeSetId={activeSetId}
        activeSetField={activeSetField}
        weightDraft={weightDraft}
        repsDraft={repsDraft}
        onOpenEditor={exerciseActions.openSetEditor}
      />

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

type WorkoutSetListProps = {
  sets: WorkoutExerciseAggregate["sets"];
  activeSetId: WorkoutSetId | null;
  activeSetField?: ActiveSetEditorPanelType;
  weightDraft?: string;
  repsDraft?: string;
  onOpenEditor: WorkoutExerciseSectionActions["openSetEditor"];
};

const WorkoutSetList = memo(function WorkoutSetList({
  sets,
  activeSetId,
  activeSetField,
  weightDraft,
  repsDraft,
  onOpenEditor,
}: WorkoutSetListProps) {
  return sets.map((set) => {
    const isActiveSet = set.id === activeSetId;
    const status =
      set.finishedAt !== null
        ? "completed"
        : isActiveSet
          ? "active"
          : "pending";

    return (
      <WorkoutSetCard
        key={set.id}
        workoutSetId={set.id}
        setIndex={set.setIndex + 1}
        setType={set.type}
        weight={set.weight}
        weightDraft={isActiveSet ? weightDraft : undefined}
        reps={set.reps}
        repsDraft={isActiveSet ? repsDraft : undefined}
        rpe={set.rpe}
        status={status}
        selected={isActiveSet}
        activeField={isActiveSet ? activeSetField : undefined}
        onOpenEditor={onOpenEditor}
      />
    );
  });
});
