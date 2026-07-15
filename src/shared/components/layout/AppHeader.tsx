import { Pressable, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { AppText } from "@/shared/components/ui/AppText";
import { colors } from "@/shared/theme/tokens";
import { cn } from "@/shared/utils/cn";

type AppHeaderProps = {
  title?: string;
  showSettings?: boolean;
  className?: string;
};

export function AppHeader({
  title = "RackRite",
  showSettings = true,
  className,
}: AppHeaderProps) {
  return (
    <View
      className={cn(
        "h-16 flex-row items-center px-screenX bg-surface",
        className,
      )}
    >
      <AppText variant="logo" className="flex-1" numberOfLines={1}>
        {title}
      </AppText>

      {showSettings ? (
        <Pressable
          hitSlop={12}
          //This here must go to settings
          onPress={() => router.push("/workout")}
          className="h-9 w-9 items-center justify-center rounded-full bg-surfaceHigh"
        >
          <Ionicons name="settings-outline" size={18} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}
