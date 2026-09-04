import {
  EXERCISE_ORDER_ROW_STRIDE,
  getExerciseOrderAutoScrollOffset,
  getExerciseOrderDragTranslation,
  getExerciseOrderDropTranslation,
  getExerciseOrderRowTranslation,
  getExerciseOrderTargetIndex,
} from "../exerciseOrderEditor.utils";

describe("exercise order editor geometry", () => {
  it("selects a new target after the dragged row crosses half a row", () => {
    expect(
      getExerciseOrderTargetIndex(1, EXERCISE_ORDER_ROW_STRIDE * 0.49, 4),
    ).toBe(1);
    expect(
      getExerciseOrderTargetIndex(1, EXERCISE_ORDER_ROW_STRIDE * 0.5, 4),
    ).toBe(2);
    expect(
      getExerciseOrderTargetIndex(2, -EXERCISE_ORDER_ROW_STRIDE * 0.5, 4),
    ).toBe(1);
  });

  it("clamps the target and active translation to the list boundaries", () => {
    expect(getExerciseOrderTargetIndex(1, 10_000, 3)).toBe(2);
    expect(getExerciseOrderTargetIndex(1, -10_000, 3)).toBe(0);
    expect(getExerciseOrderTargetIndex(0, 10, 0)).toBe(-1);

    expect(getExerciseOrderDragTranslation(1, -10_000, 3)).toBe(
      -EXERCISE_ORDER_ROW_STRIDE,
    );
    expect(getExerciseOrderDragTranslation(1, 10_000, 3)).toBe(
      EXERCISE_ORDER_ROW_STRIDE,
    );
  });

  it("opens a slot by shifting only rows crossed by the active exercise", () => {
    expect(getExerciseOrderRowTranslation(0, 1, 3, 20)).toBe(0);
    expect(getExerciseOrderRowTranslation(1, 1, 3, 20)).toBe(20);
    expect(getExerciseOrderRowTranslation(2, 1, 3, 20)).toBe(
      -EXERCISE_ORDER_ROW_STRIDE,
    );
    expect(getExerciseOrderRowTranslation(3, 1, 3, 20)).toBe(
      -EXERCISE_ORDER_ROW_STRIDE,
    );

    expect(getExerciseOrderRowTranslation(0, 2, 0, -20)).toBe(
      EXERCISE_ORDER_ROW_STRIDE,
    );
    expect(getExerciseOrderRowTranslation(1, 2, 0, -20)).toBe(
      EXERCISE_ORDER_ROW_STRIDE,
    );
    expect(getExerciseOrderRowTranslation(2, 2, 0, -20)).toBe(-20);
    expect(getExerciseOrderRowTranslation(3, 2, 0, -20)).toBe(0);
  });

  it("snaps the active exercise to the selected slot on release", () => {
    expect(getExerciseOrderDropTranslation(1, 3)).toBe(
      EXERCISE_ORDER_ROW_STRIDE * 2,
    );
    expect(getExerciseOrderDropTranslation(3, 0)).toBe(
      -EXERCISE_ORDER_ROW_STRIDE * 3,
    );
  });

  it("auto-scrolls toward a viewport edge and stays within content", () => {
    expect(getExerciseOrderAutoScrollOffset(110, 100, 500, 200, 1_000)).toBe(
      200 - (62 / 72) * 12,
    );
    expect(getExerciseOrderAutoScrollOffset(590, 100, 500, 200, 1_000)).toBe(
      200 + (62 / 72) * 12,
    );
    expect(getExerciseOrderAutoScrollOffset(100, 100, 500, 0, 1_000)).toBe(0);
    expect(getExerciseOrderAutoScrollOffset(600, 100, 500, 500, 1_000)).toBe(
      500,
    );
    expect(getExerciseOrderAutoScrollOffset(300, 100, 500, 50, 400)).toBe(0);
  });
});
