import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import React from "react";
import { Text, useColorScheme, View } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";

import { db } from "@/data/db/client";
import migrations from "@/data/db/migrations/migrations";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Stack } from "expo-router";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const { success, error } = useMigrations(db, migrations);

  console.log("Migration state:", {
    success,
    error,
  });

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />

      {error ? (
        <View>
          <Text>Migration error: {error.message}</Text>
        </View>
      ) : !success ? (
        <View>
          <Text>Preparing database...</Text>
        </View>
      ) : (
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="explore" options={{ headerShown: false }} />
          <Stack.Screen name="workout" options={{ title: "Workout" }} />
        </Stack>
      )}
    </ThemeProvider>
  );
}
