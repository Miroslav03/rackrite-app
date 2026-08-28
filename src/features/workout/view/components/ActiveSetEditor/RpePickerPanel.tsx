import { View } from "react-native";

import {
  RPE_PICKER_VALUES,
  type RpePickerValue,
} from "@/features/workout/view/activeWorkout.config";

import { EditorOptionButton } from "@/shared/components/ui/EditorOptionButton";

type RpePickerPanelProps = {
  rpe: number | null;
  disabled: boolean;
  onSelect: (rpe: RpePickerValue | null) => void;
};

export function RpePickerPanel({
  rpe,
  disabled,
  onSelect,
}: RpePickerPanelProps) {
  return (
    <View className="gap-sm">
      <View className="flex-row flex-wrap gap-sm">
        <EditorOptionButton
          label="-"
          accessibilityLabel="Clear RPE"
          selected={rpe === null}
          disabled={disabled}
          className="w-[10%] flex-grow"
          onPress={() => onSelect(null)}
        />

        {RPE_PICKER_VALUES.map((value) => (
          <EditorOptionButton
            key={value}
            label={String(value)}
            accessibilityLabel={`Set RPE to ${value}`}
            selected={rpe === value}
            disabled={disabled}
            className="w-[10%] flex-grow"
            onPress={() => onSelect(value)}
          />
        ))}
      </View>
    </View>
  );
}
