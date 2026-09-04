export const EXERCISE_ORDER_ROW_HEIGHT = 60;
export const EXERCISE_ORDER_ROW_GAP = 8;
export const EXERCISE_ORDER_ROW_STRIDE =
  EXERCISE_ORDER_ROW_HEIGHT + EXERCISE_ORDER_ROW_GAP;
const EXERCISE_ORDER_AUTO_SCROLL_EDGE = EXERCISE_ORDER_ROW_STRIDE;
const EXERCISE_ORDER_AUTO_SCROLL_STEP = 12;

export const ROW_SPRING_CONFIGURATION = {
  damping: 100,
  stiffness: 250,
} as const;

function clamp(value: number, minimum: number, maximum: number): number {
  "worklet";

  return Math.min(Math.max(value, minimum), maximum);
}

export function getExerciseOrderTargetIndex(
  sourceIndex: number,
  translationY: number,
  exerciseCount: number,
): number {
  "worklet";

  if (exerciseCount <= 0) {
    return -1;
  }

  const translatedRows = translationY / EXERCISE_ORDER_ROW_STRIDE;
  const roundedRows =
    translatedRows >= 0
      ? Math.floor(translatedRows + 0.5)
      : Math.ceil(translatedRows - 0.5);

  return clamp(sourceIndex + roundedRows, 0, exerciseCount - 1);
}

export function getExerciseOrderDragTranslation(
  sourceIndex: number,
  translationY: number,
  exerciseCount: number,
): number {
  "worklet";

  if (exerciseCount <= 0) {
    return 0;
  }

  return clamp(
    translationY,
    -sourceIndex * EXERCISE_ORDER_ROW_STRIDE,
    (exerciseCount - sourceIndex - 1) * EXERCISE_ORDER_ROW_STRIDE,
  );
}

export function getExerciseOrderRowTranslation(
  rowIndex: number,
  sourceIndex: number,
  targetIndex: number,
  activeTranslationY: number,
): number {
  "worklet";

  if (rowIndex === sourceIndex) {
    return activeTranslationY;
  }

  if (
    sourceIndex < targetIndex &&
    rowIndex > sourceIndex &&
    rowIndex <= targetIndex
  ) {
    return -EXERCISE_ORDER_ROW_STRIDE;
  }

  if (
    targetIndex < sourceIndex &&
    rowIndex >= targetIndex &&
    rowIndex < sourceIndex
  ) {
    return EXERCISE_ORDER_ROW_STRIDE;
  }

  return 0;
}

export function getExerciseOrderDropTranslation(
  sourceIndex: number,
  targetIndex: number,
): number {
  "worklet";

  return (targetIndex - sourceIndex) * EXERCISE_ORDER_ROW_STRIDE;
}

export function getExerciseOrderAutoScrollOffset(
  pointerY: number,
  viewportTop: number,
  viewportHeight: number,
  currentOffset: number,
  contentHeight: number,
): number {
  "worklet";

  if (viewportHeight <= 0 || contentHeight <= viewportHeight) {
    return 0;
  }

  const pointerInViewport = pointerY - viewportTop;
  const distanceFromTopEdge = clamp(
    EXERCISE_ORDER_AUTO_SCROLL_EDGE - pointerInViewport,
    0,
    EXERCISE_ORDER_AUTO_SCROLL_EDGE,
  );
  const distanceFromBottomEdge = clamp(
    pointerInViewport - (viewportHeight - EXERCISE_ORDER_AUTO_SCROLL_EDGE),
    0,
    EXERCISE_ORDER_AUTO_SCROLL_EDGE,
  );
  const scrollDelta =
    ((distanceFromBottomEdge - distanceFromTopEdge) /
      EXERCISE_ORDER_AUTO_SCROLL_EDGE) *
    EXERCISE_ORDER_AUTO_SCROLL_STEP;

  return clamp(currentOffset + scrollDelta, 0, contentHeight - viewportHeight);
}
