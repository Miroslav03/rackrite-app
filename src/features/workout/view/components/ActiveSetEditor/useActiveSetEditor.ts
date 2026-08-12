import type { SetType } from "@/domain/domain.types";
import {
  getActiveUnfinishedWorkoutSet,
  getActiveWorkoutExercise,
  getWorkoutSetById,
} from "@/domain/workout/workout.selectors";
import type {
  WorkoutAggregate,
  WorkoutSetId,
} from "@/domain/workout/workout.types";

import type { WorkoutSessionController } from "@/features/workout/session/useWorkoutSessionController";

import { useDebouncedCallback } from "@/shared/hooks/useDebouncedCallback";

import type {
  ActiveSetEditorPanelType,
  RpePickerValue,
  WeightKeypadKey,
} from "./activeSetEditor.types";
import { isWeightKeypadPanel } from "./activeSetEditor.utils";
import { useActiveSetEditorController } from "./useActiveSetEditorController";
import {
  formatWeightDraft,
  parseWeightDraft,
  updateWeightDraft,
} from "./weightKeypad.utils";

type ActiveSetActions = Pick<
  WorkoutSessionController,
  "updateSet" | "selectSet" | "completeSet"
>;

const WEIGHT_UPDATE_DEBOUNCE_MS = 1000;

export function useActiveSetEditor(
  workout: WorkoutAggregate,
  actions: ActiveSetActions,
) {
  const activeExercise = getActiveWorkoutExercise(workout);
  const activeSet = getActiveUnfinishedWorkoutSet(workout);

  const panelController = useActiveSetEditorController(activeSet?.id);
  const { schedule: scheduleWeightUpdate, flush: flushWeightUpdate } =
    useDebouncedCallback(
      ({
        workoutSetId,
        draft,
      }: {
        workoutSetId: WorkoutSetId;
        draft: string;
      }) =>
        actions.updateSet({
          workoutSetId,
          values: { weight: parseWeightDraft(draft) },
        }),
      WEIGHT_UPDATE_DEBOUNCE_MS,
    );

  async function savePendingWeightUpdate() {
    return (await flushWeightUpdate())?.success ?? true;
  }

  async function openSetEditor(
    nextWorkoutSetId: WorkoutSetId,
    nextPanelType: ActiveSetEditorPanelType,
  ) {
    const isChangingSet = workout.workout.activeSetId !== nextWorkoutSetId;
    const isChangingPanel = panelController.panel.type !== nextPanelType;

    const shouldFlushWeightUpdate =
      isWeightKeypadPanel(panelController.panel) &&
      (isChangingSet || isChangingPanel);

    if (shouldFlushWeightUpdate && !(await savePendingWeightUpdate())) {
      return;
    }

    if (isChangingSet) {
      const result = await actions.selectSet({
        workoutSetId: nextWorkoutSetId,
      });

      if (!result.success) {
        return;
      }
    }

    if (nextPanelType === "weightKeypad") {
      const workoutSet = getWorkoutSetById(workout, nextWorkoutSetId);

      if (!workoutSet) {
        return;
      }

      panelController.openWeightKeypad(
        nextWorkoutSetId,
        formatWeightDraft(workoutSet.weight),
      );

      return;
    }

    panelController.openPanel(nextWorkoutSetId, nextPanelType);
  }

  function adjustWeight(increment: number) {
    if (!activeSet) return;

    void actions.updateSet({
      workoutSetId: activeSet.id,
      values: {
        weight: (activeSet.weight ?? 0) + increment,
      },
    });
  }

  async function toggleWeightKeypad() {
    if (!activeSet) return;

    if (isWeightKeypadPanel(panelController.panel)) {
      if (!(await savePendingWeightUpdate())) {
        return;
      }

      panelController.openPanel(activeSet.id, "weight");

      return;
    }

    panelController.openWeightKeypad(
      activeSet.id,
      formatWeightDraft(activeSet.weight),
    );
  }

  function pressWeightKey(key: WeightKeypadKey) {
    if (!activeSet || !isWeightKeypadPanel(panelController.panel)) {
      return;
    }

    const draft = updateWeightDraft(panelController.panel.draft, key);

    if (draft === panelController.panel.draft) {
      return;
    }

    panelController.setWeightDraft(activeSet.id, draft);
    scheduleWeightUpdate({ workoutSetId: activeSet.id, draft });
  }

  function selectRpe(rpe: RpePickerValue | null) {
    if (!activeSet) return;

    void actions.updateSet({
      workoutSetId: activeSet.id,
      values: { rpe },
    });
  }

  function selectSetType(setType: SetType) {
    if (!activeSet) return;

    void actions.updateSet({
      workoutSetId: activeSet.id,
      values: { type: setType },
    });
  }

  function completeSet() {
    if (!activeSet) return;

    void actions.completeSet({ workoutSetId: activeSet.id });
  }

  return {
    activeSet,
    activeExercise,
    panel: panelController.panel,
    weightDraft: isWeightKeypadPanel(panelController.panel)
      ? panelController.panel.draft
      : undefined,
    openSetEditor,
    adjustWeight,
    toggleWeightKeypad,
    pressWeightKey,
    selectRpe,
    selectSetType,
    completeSet,
  };
}
