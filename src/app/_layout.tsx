import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "red",
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="workout" options={{ title: "Workout" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
