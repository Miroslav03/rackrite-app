import { View } from "react-native";

import { EditorOptionButton } from "@/shared/components/ui/EditorOptionButton";

const RPE_PICKER_VALUES = [5, 6, 7, 8, 9, 10] as const;

export type RpePickerValue = (typeof RPE_PICKER_VALUES)[number];

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
