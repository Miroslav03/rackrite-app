import { useRouter } from "expo-router";

import { useCallback, useState } from "react";

import { StartWorkoutFromTemplateCommand } from "@/features/workout/actions/startWorkoutFromTemplate";
import { WorkoutSessionController } from "@/features/workout/session/useWorkoutSessionController";

import { TemplateDetails } from "@/domain/templates/details/templates.types";
import { TemplateId } from "@/domain/templates/editor/templates.types";

import { DangerModalOperation } from "@/shared/components/ui/DangerModal";

import { TemplateOption } from "./components/TemplateOptionsSheet";
import {
  getModalContent,
  getModalOperation,
} from "./templateDetails.viewState.utils";

export type DangerModal =
  | { action: "deleteTemplate"; templateId: TemplateId }
  | ({
      action: "startWorkoutFromTemplate";
    } & StartWorkoutFromTemplateCommand);

export type TemplateDetailsOverlay =
  | { type: "none" }
  | { type: "dangerModal"; confirmation: DangerModal }
  | { type: "templateDetailsOptions" };

const NO_ACTIVE_OVERLAY: TemplateDetailsOverlay = { type: "none" };

type UseTemplateDetailsScreenOverlayParams = {
  template: Pick<TemplateDetails, "id" | "name" | "totalSets">;
  workoutSession: Pick<
    WorkoutSessionController,
    "state" | "startWorkoutFromTemplate"
  >;
};

export function useTemplateDetailsScreenOverlay({
  template,
  workoutSession,
}: UseTemplateDetailsScreenOverlayParams) {
  const [activeOverlay, setActiveOverlay] =
    useState<TemplateDetailsOverlay>(NO_ACTIVE_OVERLAY);

  const router = useRouter();

  const { state, startWorkoutFromTemplate } = workoutSession;

  const modalContent = getModalContent(activeOverlay);
  const modalOperation: DangerModalOperation =
    state.status === "active" || state.status === "noActiveWorkout"
      ? getModalOperation(activeOverlay, state.operation)
      : { status: "idle" };

  function closeOverlay() {
    setActiveOverlay(NO_ACTIVE_OVERLAY);
  }

  const openActiveWorkout = useCallback(
    () => router.replace("/workout"),
    [router],
  );

  const openTemplateDetailsOptions = useCallback(async () => {
    setActiveOverlay({ type: "templateDetailsOptions" });
  }, []);

  const handleDeleteTemplate = useCallback(
    async (templateId: TemplateId) => {},
    [],
  );

  const handleRequestStartWorkout = async (templateId: TemplateId) => {
    switch (state.status) {
      case "active":
        setActiveOverlay({
          type: "dangerModal",
          confirmation: {
            action: "startWorkoutFromTemplate",
            templateId,
            expectedActiveWorkoutId: state.workout.workout.id,
          },
        });
        return;

      case "noActiveWorkout":
        void handleStartWorkout({
          templateId,
          expectedActiveWorkoutId: null,
        });
        return;
    }
  };

  async function handleStartWorkout(command: StartWorkoutFromTemplateCommand) {
    const result = await startWorkoutFromTemplate(command);

    if (result.success) {
      closeOverlay();
      openActiveWorkout();
      return;
    }

    if (result.error.code === "invalidSessionState") {
      closeOverlay();
    }
  }

  async function handleTemplateDetailsOptionsSelected(option: TemplateOption) {
    if (activeOverlay.type !== "templateDetailsOptions") {
      return;
    }

    switch (option) {
      case "removeTemplate":
        setActiveOverlay({
          type: "dangerModal",
          confirmation: {
            action: "deleteTemplate",
            templateId: template.id,
          },
        });
        return;
    }
  }

  async function handleModalAction() {
    switch (activeOverlay.type) {
      case "dangerModal":
        switch (activeOverlay.confirmation.action) {
          case "deleteTemplate":
            void handleDeleteTemplate(activeOverlay.confirmation.templateId);
            return;
          case "startWorkoutFromTemplate":
            await handleStartWorkout(activeOverlay.confirmation);
            return;
        }
    }
  }

  return {
    activeOverlay,
    modalContent,
    modalOperation,
    closeOverlay,
    handleModalAction,
    handleRequestStartWorkout,
    handleTemplateDetailsOptionsSelected,
    openTemplateDetailsOptions,
  };
}
