import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import type { WorkoutExerciseAggregate } from "@/domain/workout/workout.types";

import { spacing } from "@/shared/theme/tokens";

import { EXERCISE_ORDER_ROW_STRIDE } from "./exerciseOrderEditor.utils";
import { ExerciseOrderRowContent } from "./ExerciseOrderRowContent";

type DraggableExerciseOrderRowProps = {
  exerciseAggregate: WorkoutExerciseAggregate;
  sourceIndex: number;
  exerciseCount: number;
  disabled: boolean;

  activeTranslationY: SharedValue<number>;
  dragging: SharedValue<boolean>;
  scrollOffset: SharedValue<number>;
};

export function DraggableExerciseOrderRow({
  exerciseAggregate,
  sourceIndex,
  exerciseCount,
  disabled,
  activeTranslationY,
  dragging,
  scrollOffset,
}: DraggableExerciseOrderRowProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const rowIsDragging = dragging.value;

    const rowIsFloating =
      rowIsDragging || Math.abs(activeTranslationY.value) > 0.01;

    return {
      elevation: rowIsDragging ? 8 : 0,
      opacity: rowIsFloating ? (disabled ? 0.55 : 1) : 0,
      transform: [
        {
          translateY: activeTranslationY.value - scrollOffset.value,
        },
      ],
      zIndex: rowIsFloating ? 10 : -1,
    };
  }, [disabled]);

  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          height: EXERCISE_ORDER_ROW_STRIDE,
          left: spacing.lg,
          position: "absolute",
          right: spacing.lg,
          top: spacing.sm + sourceIndex * EXERCISE_ORDER_ROW_STRIDE,
        },
        animatedStyle,
      ]}
    >
      <ExerciseOrderRowContent
        exerciseAggregate={exerciseAggregate}
        index={sourceIndex}
        exerciseCount={exerciseCount}
        disabled={disabled}
        selected
      />
    </Animated.View>
  );
}
