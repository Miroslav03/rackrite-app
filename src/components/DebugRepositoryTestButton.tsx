import React, { useState } from "react";
import { Alert, Button, Text, View } from "react-native";

import { smokeTestWorkoutRepository } from "@/features/workout/actions/smokeTestWorkoutRepository";

export function DebugRepositoryTestButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handlePress() {
    try {
      setIsRunning(true);
      setResult(null);

      await smokeTestWorkoutRepository();

      setResult("Repository smoke test passed");
      Alert.alert("Success", "Workout save/load works");
    } catch (error) {
      console.error("Repository smoke test failed", error);

      const message =
        error instanceof Error ? error.message : "Unknown repository error";

      setResult(`Failed: ${message}`);
      Alert.alert("Repository test failed", message);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <View style={{ padding: 16, gap: 8 }}>
      <Button
        title={isRunning ? "Testing..." : "Test workout repository"}
        disabled={isRunning}
        onPress={handlePress}
      />

      {result ? <Text>{result}</Text> : null}
    </View>
  );
}
