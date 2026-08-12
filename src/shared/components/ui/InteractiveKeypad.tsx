import { Ionicons } from "@expo/vector-icons";

import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { colors } from "@/shared/theme/tokens";

import { EditorOptionButton } from "./EditorOptionButton";

export type InteractiveKeypadKey =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "."
  | "clear"
  | "delete";

const NUMBER_KEY_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
] as const satisfies ReadonlyArray<ReadonlyArray<InteractiveKeypadKey>>;

const DECIMAL_ACTION_ROW = [".", "0", "clear", "delete"] as const;
const INTEGER_ACTION_ROW = ["0", "clear", "delete"] as const;

type InteractiveKeypadProps = {
  disabled: boolean;
  allowDecimal: boolean;
  inputLabel: string;
  onPress: (key: InteractiveKeypadKey) => void;
};

export function InteractiveKeypad({
  disabled,
  allowDecimal,
  inputLabel,
  onPress,
}: InteractiveKeypadProps) {
  const keyRows: ReadonlyArray<ReadonlyArray<InteractiveKeypadKey>> = [
    ...NUMBER_KEY_ROWS,
    allowDecimal ? DECIMAL_ACTION_ROW : INTEGER_ACTION_ROW,
  ];

  return (
    <Animated.View entering={FadeInDown.duration(120)} className="gap-sm">
      {keyRows.map((row) => (
        <View key={row.join("-")} className="flex-row gap-sm">
          {row.map((key) => {
            const isDelete = key === "delete";
            const label = key === "clear" ? "Clear" : key;
            const accessibilityLabel = isDelete
              ? `Delete last ${inputLabel} digit`
              : key === "clear"
                ? `Clear ${inputLabel}`
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
