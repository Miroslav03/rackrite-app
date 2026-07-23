import type { WorkoutAggregate } from "@/domain/workout/workout.types";

import { ActiveWorkoutCard } from "@/features/workout/view/components/ActiveWorkoutCard";

import { Screen } from "@/shared/components/layout/Screen";
import { ScreenHeader } from "@/shared/components/layout/ScreenHeader";
import { ScreenSection } from "@/shared/components/layout/ScreenSection";
import { useElapsedTime } from "@/shared/hooks/useElapsedTime";

type ActiveWorkoutViewProps = {
  name: string;
  workout: WorkoutAggregate;
  onOpenWorkout: () => void;
};

export function ActiveWorkoutView({
  name,
  workout,
  onOpenWorkout,
}: ActiveWorkoutViewProps) {
  const timeElapsed = useElapsedTime(workout.workout.startedAt);

  return (
    <Screen>
      <ScreenHeader
        title="Workout In Progress"
        subtitle="Your Active Training Session"
      />

      <ScreenSection title="Active Workout" className="mt-auto pt-8">
        <ActiveWorkoutCard
          name={name}
          onPress={onOpenWorkout}
          timeElapsed={timeElapsed}
        />
      </ScreenSection>
    </Screen>
  );
}
