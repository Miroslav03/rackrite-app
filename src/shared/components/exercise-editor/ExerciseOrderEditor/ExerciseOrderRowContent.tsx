import { Ionicons } from "@expo/vector-icons";

import type { AccessibilityActionEvent } from "react-native";
import Animated from "react-native-reanimated";

import { AppText } from "@/shared/components/ui/AppText";
import { colors } from "@/shared/theme/tokens";
import { cn } from "@/shared/utils/cn";

import { formatExerciseKind } from "@/features/exercises/view/utils/formatExerciseKind";

import type { ExerciseOrderItem } from "./exerciseOrderEditor.types";
import { EXERCISE_ORDER_ROW_HEIGHT } from "./exerciseOrderEditor.utils";

type ExerciseOrderRowContentProps = {
  item: ExerciseOrderItem;
  index: number;
  exerciseCount: number;
  disabled: boolean;
  selected?: boolean;
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
};

export function ExerciseOrderRowContent({
  item,
  index,
  exerciseCount,
  disabled,
  selected = false,
  onAccessibilityAction,
}: ExerciseOrderRowContentProps) {
  const exerciseId = item.id;

  const accessibilityActions = selected
    ? [
        ...(index > 0
          ? [{ name: "decrement" as const, label: "Move up" }]
          : []),
        ...(index < exerciseCount - 1
          ? [{ name: "increment" as const, label: "Move down" }]
          : []),
      ]
    : undefined;

  return (
    <Animated.View
      accessible
      accessibilityRole={selected ? "adjustable" : "text"}
      accessibilityLabel={item.name}
      accessibilityHint={
        selected
          ? "Drag to move this exercise, or use the move up and move down accessibility actions"
          : undefined
      }
      accessibilityValue={{
        min: 1,
        max: exerciseCount,
        now: index + 1,
        text: `Position ${index + 1} of ${exerciseCount}`,
      }}
      accessibilityState={{
        disabled: selected ? disabled : undefined,
        selected,
      }}
      accessibilityActions={accessibilityActions}
      className={cn(
        "flex-row items-center rounded-card border px-lg",
        selected
          ? "border-primarySoft bg-surfaceHigh"
          : "border-outline bg-surface",
      )}
      style={{ height: EXERCISE_ORDER_ROW_HEIGHT }}
      testID={`exercise-order-row-${exerciseId}`}
      onAccessibilityAction={selected ? onAccessibilityAction : undefined}
    >
      <AppText
        variant="sectionLabel"
        className="mr-md w-5 text-center text-[10px]"
      >
        {index + 1}
      </AppText>

      <Animated.View className="flex-1">
        <AppText variant="title" className="text-[20px]" numberOfLines={1}>
          {item.name}
        </AppText>
        <AppText variant="subtitle">{formatExerciseKind(item.kind)}</AppText>
      </Animated.View>

      {selected ? (
        <Ionicons name="reorder-three" size={26} color={colors.primarySoft} />
      ) : null}
    </Animated.View>
  );
}
