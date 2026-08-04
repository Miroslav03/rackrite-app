import { Ionicons } from "@expo/vector-icons";

import { useState } from "react";
import { View } from "react-native";

import type { Exercise } from "@/domain/exercises/exercise.types";
import type { WorkoutAggregate } from "@/domain/workout/workout.types";

import { ExercisePickerSheet } from "@/features/exercises/view/components/ExercisePickerSheet";
import type { AddExerciseCommand } from "@/features/workout/actions/addExercise";
import type { WorkoutSessionResult } from "@/features/workout/session/workoutSession.types";

import { HeaderMetric } from "@/shared/components/layout/HeaderMetric";
import { Screen } from "@/shared/components/layout/Screen";
import { ScreenHeader } from "@/shared/components/layout/ScreenHeader";
import { ScreenSection } from "@/shared/components/layout/ScreenSection";
import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";
import { useElapsedTime } from "@/shared/hooks/useElapsedTime";
import { colors } from "@/shared/theme/tokens";

import { RestTimerCard } from "./components/RestTimerCard";
import { WorkoutExerciseSection } from "./components/WorkoutExerciseSection";

export type ActiveWorkoutScreenActions = {
  addExercise: (
    command: AddExerciseCommand,
  ) => Promise<WorkoutSessionResult<WorkoutAggregate>>;
};

type ActiveWorkoutScreenViewProps = {
  workout: WorkoutAggregate;
  actions: ActiveWorkoutScreenActions;
};

export function ActiveWorkoutScreenView({
  workout,
  actions,
}: ActiveWorkoutScreenViewProps) {
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);

  const timeElapsed = useElapsedTime(workout.workout.startedAt);

  async function handleExerciseSelected(exercise: Exercise) {
    const result = await actions.addExercise({ exercise });

    if (result.success) {
      setExercisePickerOpen(false);
    }
  }

  const usedCompetitionFamilies = new Set(
    workout.exercises
      .map(({ exercise }) => exercise)
      .filter((exercise) => exercise.kind === "competition_lift")
      .map((exercise) => exercise.liftFamily),
  );

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
              />
            ))}
          </View>
        )}

        <ScreenSection className="mt-auto pt-8 pb-4">
          <Button
            title="Add Exercise"
            variant="outline"
            intent="neutral"
            size="lg"
            leftIcon={
              <Ionicons name="barbell-outline" size={18} color={colors.muted} />
            }
            onPress={() => setExercisePickerOpen(true)}
          />
        </ScreenSection>
      </Screen>

      <ExercisePickerSheet
        open={exercisePickerOpen}
        excludedExerciseIds={workout.exercises.map(
          ({ exercise }) => exercise.id,
        )}
        onSelect={(exercise) => {
          void handleExerciseSelected(exercise);
        }}
        excludedKinds={
          usedCompetitionFamilies.size === 3 ? ["competition_lift"] : []
        }
        onClose={() => setExercisePickerOpen(false)}
      />
    </>
  );
}
