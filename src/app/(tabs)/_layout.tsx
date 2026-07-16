import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { colors } from "@/shared/theme/tokens";

const tabIcons = {
  index: {
    active: "play",
    inactive: "play-outline",
  },
  templates: {
    active: "albums",
    inactive: "albums-outline",
  },
  history: {
    active: "time",
    inactive: "time-outline",
  },
  progress: {
    active: "trending-up",
    inactive: "trending-up-outline",
  },
  tools: {
    active: "construct",
    inactive: "construct-outline",
  },
} as const;

type TabRouteName = keyof typeof tabIcons;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor: colors.primarySoft,
        tabBarInactiveTintColor: colors.muted,

        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          height: 74,
          paddingTop: 8,
          paddingBottom: 10,
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.8,
          textTransform: "uppercase",
        },

        tabBarIcon: ({ focused, color, size }) => {
          const routeName = route.name as TabRouteName;
          const icon = tabIcons[routeName];

          return (
            <Ionicons
              name={focused ? icon.active : icon.inactive}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Start" }} />
      <Tabs.Screen name="templates" options={{ title: "Templates" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="progress" options={{ title: "Progress" }} />
      <Tabs.Screen name="tools" options={{ title: "Tools" }} />
    </Tabs>
  );
}
