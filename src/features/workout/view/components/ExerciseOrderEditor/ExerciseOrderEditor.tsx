import { Ionicons } from "@expo/vector-icons";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type AccessibilityActionEvent,
  AccessibilityInfo,
  ActivityIndicator,
  BackHandler,
  type FlatList,
  type LayoutChangeEvent,
  type ListRenderItemInfo,
  Modal,
  Pressable,
  type View,
} from "react-native";
import { Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  measure,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useFrameCallback,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";

import type {
  WorkoutExerciseAggregate,
  WorkoutExerciseId,
} from "@/domain/workout/workout.types";

import { ToastViewport } from "@/shared/components/feedback/ToastViewport";
import { AppHeader } from "@/shared/components/layout/AppHeader";
import { AppText } from "@/shared/components/ui/AppText";
import { colors, spacing } from "@/shared/theme/tokens";

import { DraggableExerciseOrderRow } from "./DraggableExerciseOrderRow";
import {
  EXERCISE_ORDER_ROW_STRIDE,
  getExerciseOrderAutoScrollOffset,
  getExerciseOrderDragTranslation,
  getExerciseOrderDropTranslation,
  getExerciseOrderTargetIndex,
  ROW_SPRING_CONFIGURATION,
} from "./exerciseOrderEditor.utils";
import { ExerciseOrderListRow } from "./ExerciseOrderListRow";

export type ExerciseOrderEditorProps = {
  exercises: readonly WorkoutExerciseAggregate[];
  initialWorkoutExerciseId: WorkoutExerciseId;
  disabled?: boolean;
  onMove: (
    workoutExerciseId: WorkoutExerciseId,
    targetIndex: number,
  ) => Promise<boolean>;
  onClose: () => void;
};

export function ExerciseOrderEditor({
  exercises,
  initialWorkoutExerciseId,
  disabled = false,
  onMove,
  onClose,
}: ExerciseOrderEditorProps) {
  const sourceIndex = exercises.findIndex(
    ({ workoutExercise }) => workoutExercise.id === initialWorkoutExerciseId,
  );

  const exerciseToMove = sourceIndex >= 0 ? exercises[sourceIndex] : undefined;

  // Saving state
  const [movePending, setMovePending] = useState(false);
  const movePendingRef = useRef(false);
  const initialPositionAppliedRef = useRef(false);

  // Drag state
  const activeTranslationY = useSharedValue(0);
  const targetIndex = useSharedValue(sourceIndex);
  const dragging = useSharedValue(false);

  // Raw gesture state
  const gestureTranslationY = useSharedValue(0);
  const pointerAbsoluteY = useSharedValue(0);

  // List references
  const listRef = useAnimatedRef<FlatList<WorkoutExerciseAggregate>>();
  const listViewportRef = useAnimatedRef<View>();

  // Scroll / layout
  const scrollOffset = useSharedValue(0);
  const dragStartScrollOffset = useSharedValue(0);
  const viewportTop = useSharedValue(0);
  const viewportHeight = useSharedValue(0);

  const initialScrollIndex = sourceIndex > 1 ? sourceIndex - 1 : 0;

  const contentHeight =
    exercises.length * EXERCISE_ORDER_ROW_STRIDE + spacing.sm;

  const interactionDisabled =
    disabled || movePending || sourceIndex < 0 || exercises.length < 2;

  const handleListLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;

      viewportHeight.value = height;

      if (height <= 0 || initialPositionAppliedRef.current) {
        return;
      }

      initialPositionAppliedRef.current = true;

      const initialOffset = Math.min(
        initialScrollIndex * EXERCISE_ORDER_ROW_STRIDE,
        Math.max(contentHeight - height, 0),
      );

      scrollOffset.value = initialOffset;
      dragStartScrollOffset.value = initialOffset;

      listRef.current?.scrollToOffset({
        animated: false,
        offset: initialOffset,
      });
    },
    [
      contentHeight,
      dragStartScrollOffset,
      initialScrollIndex,
      listRef,
      scrollOffset,
      viewportHeight,
    ],
  );

  const handleListScroll = useAnimatedScrollHandler((event) => {
    scrollOffset.value = event.contentOffset.y;
  });

  const resetDrag = useCallback(() => {
    scheduleOnUI(() => {
      "worklet";
      scrollOffset.value = dragStartScrollOffset.value;
      scrollTo(listRef, 0, dragStartScrollOffset.value, false);
      targetIndex.value = sourceIndex;
      activeTranslationY.value = withSpring(0, ROW_SPRING_CONFIGURATION);
      dragging.value = false;
    });
  }, [
    activeTranslationY,
    dragStartScrollOffset,
    dragging,
    listRef,
    scrollOffset,
    sourceIndex,
    targetIndex,
  ]);

  const closeEditor = useCallback(() => {
    if (disabled || movePendingRef.current) {
      return;
    }

    onClose();
  }, [disabled, onClose]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        closeEditor();
        return true;
      },
    );

    return () => subscription.remove();
  }, [closeEditor]);

  const submitMove = useCallback(
    async (nextIndex: number) => {
      if (
        movePendingRef.current ||
        disabled ||
        sourceIndex < 0 ||
        nextIndex === sourceIndex
      ) {
        resetDrag();
        return;
      }

      movePendingRef.current = true;
      setMovePending(true);

      let moved = false;

      try {
        moved = await onMove(initialWorkoutExerciseId, nextIndex);
      } catch {
        moved = false;
      }

      movePendingRef.current = false;
      setMovePending(false);

      if (!moved) {
        resetDrag();
        return;
      }

      dragging.value = false;

      AccessibilityInfo.announceForAccessibility(
        `${exerciseToMove?.exercise.name ?? "Exercise"} moved to position ${
          nextIndex + 1
        } of ${exercises.length}`,
      );

      onClose();
    },
    [
      disabled,
      dragging,
      exerciseToMove?.exercise.name,
      exercises.length,
      initialWorkoutExerciseId,
      onClose,
      onMove,
      resetDrag,
      sourceIndex,
    ],
  );

  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (interactionDisabled) {
        return;
      }

      switch (event.nativeEvent.actionName) {
        case "increment":
          void submitMove(Math.min(sourceIndex + 1, exercises.length - 1));
          return;

        case "decrement":
          void submitMove(Math.max(sourceIndex - 1, 0));
          return;
      }
    },
    [exercises.length, interactionDisabled, sourceIndex, submitMove],
  );

  useFrameCallback(() => {
    if (!dragging.value) {
      return;
    }

    const nextScrollOffset = getExerciseOrderAutoScrollOffset(
      pointerAbsoluteY.value,
      viewportTop.value,
      viewportHeight.value,
      scrollOffset.value,
      contentHeight,
    );

    if (nextScrollOffset !== scrollOffset.value) {
      scrollOffset.value = nextScrollOffset;

      scrollTo(listRef, 0, nextScrollOffset, false);
    }

    const translationY = getExerciseOrderDragTranslation(
      sourceIndex,
      gestureTranslationY.value +
        nextScrollOffset -
        dragStartScrollOffset.value,
      exercises.length,
    );

    activeTranslationY.value = translationY;

    targetIndex.value = getExerciseOrderTargetIndex(
      sourceIndex,
      translationY,
      exercises.length,
    );
  });

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!interactionDisabled)
        .maxPointers(1)
        .minDistance(2)
        .onStart((event) => {
          const viewportMeasurement = measure(listViewportRef);

          if (viewportMeasurement) {
            viewportTop.value = viewportMeasurement.pageY;
            viewportHeight.value = viewportMeasurement.height;
          }

          dragging.value = true;
          targetIndex.value = sourceIndex;
          activeTranslationY.value = 0;

          dragStartScrollOffset.value = scrollOffset.value;

          gestureTranslationY.value = 0;
          pointerAbsoluteY.value = event.absoluteY;
        })
        .onUpdate((event) => {
          gestureTranslationY.value = event.translationY;
          pointerAbsoluteY.value = event.absoluteY;

          const translationY = getExerciseOrderDragTranslation(
            sourceIndex,
            event.translationY +
              scrollOffset.value -
              dragStartScrollOffset.value,
            exercises.length,
          );

          activeTranslationY.value = translationY;

          targetIndex.value = getExerciseOrderTargetIndex(
            sourceIndex,
            translationY,
            exercises.length,
          );
        })
        .onEnd((_event, succeeded) => {
          if (!succeeded) {
            return;
          }

          dragging.value = false;
          const nextIndex = targetIndex.value;

          if (nextIndex === sourceIndex) {
            scrollOffset.value = dragStartScrollOffset.value;
            scrollTo(listRef, 0, dragStartScrollOffset.value, false);
            activeTranslationY.value = withSpring(0, ROW_SPRING_CONFIGURATION);
            return;
          }

          activeTranslationY.value = withSpring(
            getExerciseOrderDropTranslation(sourceIndex, nextIndex),
            ROW_SPRING_CONFIGURATION,
          );

          scheduleOnRN(submitMove, nextIndex);
        })
        .onFinalize((_event, succeeded) => {
          if (succeeded || !dragging.value) {
            return;
          }

          scrollOffset.value = dragStartScrollOffset.value;
          scrollTo(listRef, 0, dragStartScrollOffset.value, false);
          targetIndex.value = sourceIndex;
          activeTranslationY.value = withSpring(0, ROW_SPRING_CONFIGURATION);
          dragging.value = false;
        })
        .withTestId(`exercise-order-pan-${initialWorkoutExerciseId}`),
    [
      activeTranslationY,
      dragStartScrollOffset,
      dragging,
      exercises.length,
      gestureTranslationY,
      initialWorkoutExerciseId,
      interactionDisabled,
      listRef,
      listViewportRef,
      pointerAbsoluteY,
      scrollOffset,
      sourceIndex,
      submitMove,
      targetIndex,
      viewportHeight,
      viewportTop,
    ],
  );

  const renderExercise = useCallback(
    ({ item, index }: ListRenderItemInfo<WorkoutExerciseAggregate>) => (
      <ExerciseOrderListRow
        exerciseAggregate={item}
        index={index}
        sourceIndex={sourceIndex}
        exerciseCount={exercises.length}
        disabled={interactionDisabled}
        targetIndex={targetIndex}
        activeTranslationY={activeTranslationY}
        dragging={dragging}
        panGesture={panGesture}
        onAccessibilityAction={handleAccessibilityAction}
      />
    ),
    [
      activeTranslationY,
      dragging,
      exercises.length,
      handleAccessibilityAction,
      interactionDisabled,
      panGesture,
      sourceIndex,
      targetIndex,
    ],
  );

  return (
    <Modal
      visible
      animationType="fade"
      statusBarTranslucent
      onRequestClose={closeEditor}
    >
      <GestureHandlerRootView className="flex-1 bg-background">
        <SafeAreaView
          accessibilityViewIsModal
          className="flex-1 bg-background"
          edges={["top", "bottom", "left", "right"]}
        >
          <AppHeader
            showSettings={false}
            rightAccessory={
              <Animated.View>
                <Pressable
                  hitSlop={12}
                  onPress={closeEditor}
                  disabled={disabled || movePending}
                  className="h-9 w-9 items-center justify-center rounded-full bg-surfaceHigh"
                >
                  <Ionicons name="close" size={20} color={colors.muted} />
                </Pressable>
              </Animated.View>
            }
          />

          <Animated.View className="px-screenX py-lg">
            <AppText variant="title" className="text-[28px]">
              Reorder Exercise
            </AppText>

            <AppText variant="subtitle" className="mt-xs">
              Drag the selected exercise to its new position
            </AppText>
          </Animated.View>

          <Animated.View
            ref={listViewportRef}
            className="flex-1 overflow-hidden"
            onLayout={handleListLayout}
          >
            <Animated.FlatList
              ref={listRef}
              className="flex-1"
              data={exercises}
              extraData={interactionDisabled}
              keyExtractor={({ workoutExercise }) => workoutExercise.id}
              renderItem={renderExercise}
              getItemLayout={(_, index) => ({
                index,
                length: EXERCISE_ORDER_ROW_STRIDE,
                offset: index * EXERCISE_ORDER_ROW_STRIDE,
              })}
              initialNumToRender={Math.min(Math.max(exercises.length, 1), 10)}
              maxToRenderPerBatch={10}
              windowSize={7}
              removeClippedSubviews={false}
              contentContainerStyle={{
                paddingTop: spacing.sm,
                paddingHorizontal: spacing.lg,
              }}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              onScroll={handleListScroll}
              ListEmptyComponent={
                <AppText variant="body">
                  There are no exercises to reorder.
                </AppText>
              }
            />

            {exerciseToMove ? (
              <DraggableExerciseOrderRow
                exerciseAggregate={exerciseToMove}
                sourceIndex={sourceIndex}
                exerciseCount={exercises.length}
                disabled={interactionDisabled}
                activeTranslationY={activeTranslationY}
                dragging={dragging}
                scrollOffset={scrollOffset}
              />
            ) : null}
          </Animated.View>

          {movePending ? (
            <Animated.View
              accessibilityLiveRegion="polite"
              className="flex-row items-center justify-center gap-sm py-md"
            >
              <ActivityIndicator color={colors.primarySoft} size="small" />

              <AppText variant="subtitle">Saving new position...</AppText>
            </Animated.View>
          ) : null}

          <ToastViewport layer="modal" />
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}
