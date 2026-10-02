import { useRouter } from "expo-router";

import { useCallback, useState } from "react";

import { StartWorkoutFromTemplateCommand } from "@/features/workout/actions/startWorkoutFromTemplate";
import { WorkoutSessionController } from "@/features/workout/session/useWorkoutSessionController";

import { TemplateDetails } from "@/domain/templates/details/templates.types";
import { TemplateId } from "@/domain/templates/editor/templates.types";

import type { TemplateDetailsController } from "../controller/useTemplateDetailsController";

import { TemplateOption } from "./components/TemplateOptionsSheet";
import {
  getModalContent,
  getModalOperation,
  getTemplateDetailsOperations,
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
  templateSession: Pick<TemplateDetailsController, "state" | "deleteTemplate">;
  workoutSession: Pick<
    WorkoutSessionController,
    "state" | "startWorkoutFromTemplate"
  >;
};

export function useTemplateDetailsScreenOverlay({
  template,
  workoutSession,
  templateSession,
}: UseTemplateDetailsScreenOverlayParams) {
  const [activeOverlay, setActiveOverlay] =
    useState<TemplateDetailsOverlay>(NO_ACTIVE_OVERLAY);

  const router = useRouter();

  const { state: workoutState, startWorkoutFromTemplate } = workoutSession;
  const { state: templateState } = templateSession;

  const operations = getTemplateDetailsOperations(workoutState, templateState);
  const modalContent = getModalContent(activeOverlay);
  const modalOperation = getModalOperation(
    activeOverlay,
    operations.workoutOperation,
    operations.templateOperation,
  );

  function closeOverlay() {
    setActiveOverlay(NO_ACTIVE_OVERLAY);
  }

  const openActiveWorkout = useCallback(
    () => router.replace("/workout"),
    [router],
  );

  function openTemplateDetailsOptions() {
    setActiveOverlay({ type: "templateDetailsOptions" });
  }

  async function handleDeleteTemplate(templateId: TemplateId) {
    const result = await templateSession.deleteTemplate(templateId);

    if (result.success) {
      setActiveOverlay(NO_ACTIVE_OVERLAY);
      router.replace("/templates");
    }
  }

  const handleRequestStartWorkout = async (templateId: TemplateId) => {
    if (
      workoutState.status === "loading" ||
      workoutState.status === "loadError"
    ) {
      return;
    }

    switch (workoutState.status) {
      case "active":
        setActiveOverlay({
          type: "dangerModal",
          confirmation: {
            action: "startWorkoutFromTemplate",
            templateId,
            expectedActiveWorkoutId: workoutState.workout.workout.id,
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
    if (activeOverlay.type !== "dangerModal") {
      return;
    }

    switch (activeOverlay.type) {
      case "dangerModal":
        switch (activeOverlay.confirmation.action) {
          case "deleteTemplate":
            await handleDeleteTemplate(activeOverlay.confirmation.templateId);
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
    canStartWorkout: operations.canStartWorkout,
    startPending: operations.startPending,
    errorOperation: operations.errorOperation,
    closeOverlay,
    handleModalAction,
    handleRequestStartWorkout,
    handleTemplateDetailsOptionsSelected,
    openTemplateDetailsOptions,
  };
}
