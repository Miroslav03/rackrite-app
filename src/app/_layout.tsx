import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import React from "react";
import { Text, useColorScheme, View } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";

import { db } from "@/data/db/client";
import migrations from "@/data/db/migrations/migrations";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";

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
        <AppTabs />
      )}
    </ThemeProvider>
  );
}
