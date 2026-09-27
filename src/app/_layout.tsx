import { Stack } from "expo-router";

import { useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DatabaseBootstrap } from "@/bootstrap/DatabaseBootstrap";

import { templateSessionActions } from "@/features/templates/editor/actions/templateSessionActions";
import { TemplateSessionProvider } from "@/features/templates/editor/session/TemplateSessionProvider";
import { workoutSessionActions } from "@/features/workout/actions/workoutSessionActions";
import { WorkoutSessionProvider } from "@/features/workout/session/WorkoutSessionProvider";

import { ToastProvider } from "@/shared/components/feedback/ToastProvider";
import { colors } from "@/shared/theme/tokens";

import "../global.css";

export default function RootLayout() {
  const [startupAttempt, setStartupAttempt] = useState(0);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <DatabaseBootstrap
            key={startupAttempt}
            onRetry={() => {
              setStartupAttempt((current) => current + 1);
            }}
          >
            <WorkoutSessionProvider actions={workoutSessionActions}>
              <TemplateSessionProvider actions={templateSessionActions}>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: {
                      backgroundColor: colors.background,
                    },
                  }}
                >
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="history/[workoutId]"
                    options={{ title: "Workout Details" }}
                  />
                  <Stack.Screen name="workout" options={{ title: "Workout" }} />
                  <Stack.Screen
                    name="template-editor"
                    options={{ title: "Template" }}
                  />
                </Stack>
              </TemplateSessionProvider>
            </WorkoutSessionProvider>
          </DatabaseBootstrap>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
