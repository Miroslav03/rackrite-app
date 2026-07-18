import { Ionicons } from "@expo/vector-icons";
import { Pressable, View, type PressableProps } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { SurfaceCard } from "@/shared/components/ui/SurfaceCard";
import { colors } from "@/shared/theme/tokens";
import { cn } from "@/shared/utils/cn";

type WorkoutSetStatus = "completed" | "active" | "pending";

type WorkoutSetCardProps = PressableProps & {
  setIndex: number;
  setType: string;
  weight: string;
  reps: string;
  rpe?: string;
  showRpe?: boolean;
  status?: WorkoutSetStatus;
  className?: string;
};

export function WorkoutSetCard({
  setIndex,
  setType,
  weight,
  reps,
  rpe,
  showRpe = false,
  status = "pending",
  className,
  disabled,
  ...props
}: WorkoutSetCardProps) {
  const isCompleted = status === "completed";
  const isActive = status === "active";
  const isPending = status === "pending";

  return (
    <Pressable disabled={disabled} className={className} {...props}>
      <SurfaceCard
        variant={isCompleted ? "success" : isActive ? "high" : "default"}
        accent={isCompleted ? "success" : isActive ? "primary" : "none"}
        selected={isActive}
        contentClassName="min-h-[58px] flex-row items-center gap-md px-md py-sm"
        className={cn(isPending && "opacity-60")}
      >
        <View className="w-10 items-center">
          <AppText
            variant="sectionLabel"
            className={cn(
              "mb-xs text-center",
              isCompleted && "text-successBorder",
            )}
          >
            Set {setIndex}
          </AppText>

          <View
            className={cn(
              "h-4 w-4 items-center justify-center rounded-full",
              isCompleted ? "bg-successBorder" : "bg-surfaceHighest",
            )}
          >
            {isCompleted ? (
              <Ionicons name="checkmark" size={10} color={colors.background} />
            ) : (
              <View
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isActive ? "bg-primarySoft" : "bg-transparent",
                )}
              />
            )}
          </View>
        </View>

        <View className="flex-[1.4]">
          <AppText variant="sectionLabel">Type</AppText>
          <AppText className="text-sm font-black text-foreground">
            {setType}
          </AppText>
        </View>

        <View className="flex-1  items-center">
          <AppText variant="sectionLabel">Weight</AppText>
          <AppText className="text-sm font-black text-foreground">
            {weight}
          </AppText>
        </View>

        <View className="flex-1  items-center">
          <AppText variant="sectionLabel">Reps</AppText>
          <AppText className="text-sm font-black text-foreground">
            {reps}
          </AppText>
        </View>

        <View className="flex-1  items-center">
          <AppText variant="sectionLabel">RPE</AppText>
          <AppText className="text-sm font-black text-foreground">
            {rpe ?? "—"}
          </AppText>
        </View>
      </SurfaceCard>
    </Pressable>
  );
}
