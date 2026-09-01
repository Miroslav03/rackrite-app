import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { colors } from "@/shared/theme/tokens";

type RestTimerCardProps = {
  time: string;
  disabled?: boolean;
  onPress: () => void;
};

export function RestTimerCard({
  time,
  disabled = false,
  onPress,
}: RestTimerCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Rest timer, ${time} remaining`}
      accessibilityHint="Opens rest timer controls"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
    >
      <View className="flex-row items-center gap-sm">
        <Ionicons name="timer-outline" size={20} color={colors.primarySoft} />

        <AppText
          variant="title"
          className="text-xl leading-none tracking-tight"
        >
          {time}
        </AppText>
      </View>
    </Pressable>
  );
}
