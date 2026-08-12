import { View } from "react-native";

import { EditorOptionButton } from "./EditorOptionButton";
import {
  RPE_PICKER_VALUES,
  type RpePickerValue,
} from "./activeSetEditor.types";

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
