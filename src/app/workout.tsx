import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { getActiveWorkoutAggregate } from "@/data/repositories/workoutRepository";

import type { WorkoutAggregate } from "@/domain/workout/workout.types";

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
    <View style={{ padding: 16 }}>
      <Text>Workout Screen</Text>
      <Text>ID: {workout.workout.id}</Text>
      <Text>Status: {workout.workout.status}</Text>
      <Text>Sections: {workout.sections.length}</Text>
    </View>
  );
}
