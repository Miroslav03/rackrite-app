import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { AppText } from "@/shared/components/ui/AppText";
import { colors } from "@/shared/theme/tokens";
import { cn } from "@/shared/utils/cn";

type AppHeaderProps = {
  title?: string;
  showBackButton?: boolean;
  showSettings?: boolean;
  rightAccessory?: ReactNode;
  className?: string;
};

export function AppHeader({
  title = "RackRite",
  showBackButton = false,
  rightAccessory,
  className,
}: AppHeaderProps) {
  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <View
      className={cn(
        "h-16 flex-row items-center px-screenX bg-surface",
        className,
      )}
    >
      {showBackButton ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={goBack}
          className="mr-sm h-9 w-9 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={20} color={colors.foreground} />
        </Pressable>
      ) : null}
      <AppText variant="logo" className="flex-1" numberOfLines={1}>
        {title}
      </AppText>

      {rightAccessory ? (
        <View className="ml-xl flex-row items-center gap-lg">
          {rightAccessory}
        </View>
      ) : null}
    </View>
  );
}
