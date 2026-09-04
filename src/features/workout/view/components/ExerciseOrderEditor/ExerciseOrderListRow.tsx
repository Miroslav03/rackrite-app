import { type AccessibilityActionEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import type { WorkoutExerciseAggregate } from "@/domain/workout/workout.types";

import {
  EXERCISE_ORDER_ROW_STRIDE,
  getExerciseOrderRowTranslation,
  ROW_SPRING_CONFIGURATION,
} from "./exerciseOrderEditor.utils";
import { ExerciseOrderRowContent } from "./ExerciseOrderRowContent";

type ExerciseOrderListRowProps = {
  exerciseAggregate: WorkoutExerciseAggregate;
  index: number;
  sourceIndex: number;
  exerciseCount: number;
  disabled: boolean;

  targetIndex: SharedValue<number>;
  activeTranslationY: SharedValue<number>;
  dragging: SharedValue<boolean>;

  panGesture: ReturnType<typeof Gesture.Pan>;

  onAccessibilityAction: (event: AccessibilityActionEvent) => void;
};

export function ExerciseOrderListRow({
  exerciseAggregate,
  index,
  sourceIndex,
  exerciseCount,
  disabled,
  targetIndex,
  activeTranslationY,
  dragging,
  panGesture,
  onAccessibilityAction,
}: ExerciseOrderListRowProps) {
  const selected = index === sourceIndex;

  const animatedStyle = useAnimatedStyle(() => {
    const floating =
      dragging.value || Math.abs(activeTranslationY.value) > 0.01;

    if (selected) {
      return {
        opacity: floating ? 0 : 1,
        transform: [
          {
            translateY: 0,
          },
        ],
      };
    }

    const translationY = getExerciseOrderRowTranslation(
      index,
      sourceIndex,
      targetIndex.value,
      0,
    );

    return {
      opacity: 1,

      transform: [
        {
          translateY: withSpring(translationY, ROW_SPRING_CONFIGURATION),
        },
      ],
    };
  }, [index, selected, sourceIndex]);

  const row = (
    <Animated.View
      style={[
        {
          height: EXERCISE_ORDER_ROW_STRIDE,
        },
        animatedStyle,
      ]}
    >
      <ExerciseOrderRowContent
        exerciseAggregate={exerciseAggregate}
        index={index}
        exerciseCount={exerciseCount}
        disabled={disabled}
        selected={selected}
        onAccessibilityAction={selected ? onAccessibilityAction : undefined}
      />
    </Animated.View>
  );

  if (selected) {
    return <GestureDetector gesture={panGesture}>{row}</GestureDetector>;
  }

  return row;
}
