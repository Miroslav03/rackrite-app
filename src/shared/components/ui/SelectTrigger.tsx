import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { colors } from "@/shared/theme/tokens";
import { cn } from "@/shared/utils/cn";

type SelectTriggerProps = {
  label?: string;
  value: string;
  onPress: () => void;
  className?: string;
};

export function SelectTrigger({
  label,
  value,
  onPress,
  className,
}: SelectTriggerProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn("flex-row items-center gap-xs", className)}
    >
      <View>
        {label ? (
          <AppText variant="subtitle" className="mb-xs">
            {label}
          </AppText>
        ) : null}

        <View className="flex-row items-center gap-xs">
          <AppText variant="subtitle">{value}</AppText>

          <Ionicons name="chevron-down" size={14} color={colors.muted} />
        </View>
      </View>
    </Pressable>
  );
}
