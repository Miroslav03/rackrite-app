import { Stack } from "expo-router";

import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DatabaseBootstrap } from "@/bootstrap/DatabaseBootstrap";

import { colors } from "@/shared/theme/tokens";

import "../global.css";

export default function RootLayout() {
  const [startupAttempt, setStartupAttempt] = useState(0);

  return (
    <SafeAreaProvider>
      <DatabaseBootstrap
        key={startupAttempt}
        onRetry={() => {
          setStartupAttempt((current) => current + 1);
        }}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colors.background,
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="workout" options={{ title: "Workout" }} />
        </Stack>
      </DatabaseBootstrap>
    </SafeAreaProvider>
  );
}
