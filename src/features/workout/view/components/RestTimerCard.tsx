import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { SurfaceCard } from "@/shared/components/ui/SurfaceCard";
import { colors } from "@/shared/theme/tokens";

type RestTimerCardProps = {
  time: string;
};

export function RestTimerCard({ time }: RestTimerCardProps) {
  return (
    <SurfaceCard
      variant="default"
      accent="primary"
      contentClassName="h-[56px] flex-row items-center justify-between px-lg py-0"
    >
      <View className="flex-row items-center gap-sm">
        <Ionicons name="timer-outline" size={24} color={colors.primarySoft} />

        <AppText variant="sectionLabel" className="text-[12px] text-muted">
          Rest Timer
        </AppText>
      </View>

      <AppText variant="title" className="text-2xl leading-none tracking-tight">
        {time}
      </AppText>
    </SurfaceCard>
  );
}
