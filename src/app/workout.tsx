import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { getActiveWorkoutAggregate } from "@/data/repositories/workoutRepository";

import type { WorkoutAggregate } from "@/domain/workout/workout.types";

import { HeaderMetric } from "@/shared/components/layout/HeaderMetric";
import { Screen } from "@/shared/components/layout/Screen";
import { ScreenHeader } from "@/shared/components/layout/ScreenHeader";

export default function WorkoutScreen() {
  const [workout, setWorkout] = useState<WorkoutAggregate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadActiveWorkout() {
      try {
        const activeWorkout = await getActiveWorkoutAggregate();
        console.log(activeWorkout);

        setWorkout(activeWorkout);
      } catch (error) {
        console.error("Failed to load active workout", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadActiveWorkout();
  }, []);

  if (isLoading) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Loading workout...</Text>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={{ padding: 16 }}>
        <Text>No active workout found.</Text>
      </View>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="New Workout"
        subtitle="ACTIVE WORKOUT"
        rightAccessory={<HeaderMetric value="32:10" label="Duration" />}
      />
    </Screen>
  );
}
