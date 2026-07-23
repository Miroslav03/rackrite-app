import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { SurfaceCard } from "@/shared/components/ui/SurfaceCard";
import { colors } from "@/shared/theme/tokens";

type ActiveWorkoutCardProps = {
  name: string;
  timeElapsed: string;
  onPress: () => void;
};

export function ActiveWorkoutCard({
  name,
  timeElapsed,
  onPress,
}: ActiveWorkoutCardProps) {
  return (
    <Pressable
      accessibilityHint="Opens your active workout"
      accessibilityLabel={`Continue ${name}, ${timeElapsed} elapsed`}
      accessibilityRole="button"
      onPress={onPress}
    >
      <SurfaceCard
        accent="none"
        className="bg-primary"
        contentClassName="flex-row items-center"
        variant="high"
      >
        <View className="flex-1">
          <AppText variant="logo" className=" tracking-tight text-foreground">
            Continue Workout
          </AppText>

          <AppText
            numberOfLines={1}
            variant="sectionLabel"
            className="text-sm text-primarySoft"
          >
            {name} - {timeElapsed} elapsed
          </AppText>
        </View>

        <Ionicons name="play" size={25} color={colors.foreground} />
      </SurfaceCard>
    </Pressable>
  );
}
