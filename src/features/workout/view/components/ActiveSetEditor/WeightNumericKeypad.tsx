import { Ionicons } from "@expo/vector-icons";

import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { colors } from "@/shared/theme/tokens";

import {
  WEIGHT_KEYPAD_KEY_ROWS,
  type WeightKeypadKey,
} from "./activeSetEditor.types";
import { EditorOptionButton } from "./EditorOptionButton";

type WeightNumericKeypadProps = {
  disabled: boolean;
  onPress: (key: WeightKeypadKey) => void;
};

export function WeightNumericKeypad({
  disabled,
  onPress,
}: WeightNumericKeypadProps) {
  return (
    <Animated.View entering={FadeInDown.duration(120)} className="gap-sm">
      {WEIGHT_KEYPAD_KEY_ROWS.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row gap-sm">
          {row.map((key) => {
            const isDelete = key === "delete";
            const label = key === "clear" ? "Clear" : key;
            const accessibilityLabel = isDelete
              ? "Delete last weight digit"
              : key === "clear"
                ? "Clear weight"
                : key === "."
                  ? "Decimal point"
                  : `Number ${key}`;

            return (
              <EditorOptionButton
                key={key}
                label={label}
                accessibilityLabel={accessibilityLabel}
                icon={
                  isDelete ? (
                    <Ionicons
                      name="backspace-outline"
                      size={22}
                      color={colors.foreground}
                    />
                  ) : undefined
                }
                disabled={disabled}
                className="flex-1"
                onPress={() => onPress(key)}
              />
            );
          })}
        </View>
      ))}
    </Animated.View>
  );
}
