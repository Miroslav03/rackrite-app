import { View } from "react-native";

import type { SetType } from "@/domain/domain.types";

import { SET_TYPE_LABEL_COLORS } from "@/features/workout/view/workoutSetType.config";

import { EditorOptionButton } from "@/shared/components/ui/EditorOptionButton";
import { colors } from "@/shared/theme/tokens";

const SET_TYPE_OPTIONS: ReadonlyArray<{ label: string; value: SetType }> = [
  { label: "Warm-up", value: "warmup" },
  { label: "Working", value: "working" },
  { label: "Top Set", value: "top" },
  { label: "Backoff", value: "backoff" },
];

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
          selectedBackgroundColor={SET_TYPE_LABEL_COLORS[option.value]}
          hoverBackgroundColor={SET_TYPE_LABEL_COLORS[option.value]}
          selectedForegroundColor={colors.background}
          disabled={disabled}
          className="w-[40%] flex-grow"
          onPress={() => onSelect(option.value)}
        />
      ))}
    </View>
  );
}
