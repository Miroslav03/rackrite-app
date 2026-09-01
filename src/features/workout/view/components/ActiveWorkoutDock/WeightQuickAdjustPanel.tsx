import { View } from "react-native";

import { WEIGHT_INCREMENTS } from "@/features/workout/view/activeWorkout.config";

import { EditorOptionButton } from "@/shared/components/ui/EditorOptionButton";

type WeightQuickAdjustPanelProps = {
  disabled: boolean;
  onAdjust: (increment: number) => void;
};

export function WeightQuickAdjustPanel({
  disabled,
  onAdjust,
}: WeightQuickAdjustPanelProps) {
  return (
    <View className="flex-row gap-sm">
      {WEIGHT_INCREMENTS.map((increment) => (
        <EditorOptionButton
          key={increment}
          label={`+${increment} kg`}
          accessibilityLabel={`Add ${increment} kilograms`}
          disabled={disabled}
          className="flex-1"
          onPress={() => onAdjust(increment)}
        />
      ))}
    </View>
  );
}
