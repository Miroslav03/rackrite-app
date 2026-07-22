import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import type { WorkoutAggregate } from "@/domain/workout/workout.types";
import { Screen } from "@/shared/components/layout/Screen";
import { ScreenHeader } from "@/shared/components/layout/ScreenHeader";
import { ScreenSection } from "@/shared/components/layout/ScreenSection";
import { AppText } from "@/shared/components/ui/AppText";
import { SurfaceCard } from "@/shared/components/ui/SurfaceCard";
import { colors } from "@/shared/theme/tokens";

type ActiveWorkoutViewProps = {
  workout: WorkoutAggregate;
  onOpenWorkout: () => void;
};

export function ActiveWorkoutView({
  workout,
  onOpenWorkout,
}: ActiveWorkoutViewProps) {
  const exerciseCount = workout.exercises.length;

  return (
    <Screen>
      <ScreenHeader
        title="Workout In Progress"
        subtitle="Your Active Training Session"
      />

      <ScreenSection title="Active Workout" className="mt-auto pt-8">
        <Pressable
          accessibilityHint="Opens your active workout"
          accessibilityLabel="Continue active workout"
          accessibilityRole="button"
          onPress={onOpenWorkout}
        >
          <SurfaceCard accent="primary" variant="high">
            <View className="flex-row items-center gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
                <Ionicons name="barbell" size={22} color={colors.foreground} />
              </View>

              <View className="flex-1">
                <AppText variant="button">Continue Workout</AppText>
                <AppText className="mt-1 text-sm">
                  {exerciseCount === 0
                    ? "No exercises added yet"
                    : `${exerciseCount} ${exerciseCount === 1 ? "exercise" : "exercises"}`}
                </AppText>
              </View>

              <Ionicons
                name="chevron-forward"
                size={22}
                color={colors.primarySoft}
              />
            </View>
          </SurfaceCard>
        </Pressable>
      </ScreenSection>
    </Screen>
  );
}
