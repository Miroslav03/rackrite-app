import { View } from "react-native";

import type { SetType } from "@/domain/domain.types";

import { SET_TYPE_CONFIG, SET_TYPE_OPTIONS } from "@/shared/theme/setTypes";

import { EditorOptionButton } from "@/shared/components/ui/EditorOptionButton";
import { colors } from "@/shared/theme/tokens";

type SetTypePickerPanelProps = {
  setType: SetType;
  disabled: boolean;
  onSelect: (setType: SetType) => void;
};

export function SetTypePickerPanel({
  setType,
  disabled,
  onSelect,
}: SetTypePickerPanelProps) {
  return (
    <View className="flex-row flex-wrap gap-sm">
      {SET_TYPE_OPTIONS.map((option) => (
        <EditorOptionButton
          key={option.value}
          label={option.label}
          accessibilityLabel={`Set type to ${option.label}`}
          selected={setType === option.value}
          selectedBackgroundColor={SET_TYPE_CONFIG[option.value].accentColor}
          hoverBackgroundColor={SET_TYPE_CONFIG[option.value].accentColor}
          selectedForegroundColor={colors.background}
          disabled={disabled}
          className="w-[40%] flex-grow"
          onPress={() => onSelect(option.value)}
        />
      ))}
    </View>
  );
}
