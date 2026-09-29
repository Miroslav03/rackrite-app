import { useIsFocused, useRouter } from "expo-router";

import { useCallback } from "react";

import type { TemplateId } from "@/domain/templates/editor/templates.types";

import { useTemplateSession } from "@/features/templates/editor/session/TemplateSessionContext";
import { templatesActions } from "@/features/templates/list/actions/templatesActions";
import { useTemplatesController } from "@/features/templates/list/controller/useTemplatesController";
import { TemplatesScreenLoadError } from "@/features/templates/list/view/TemplatesScreenLoadError";
import { TemplatesScreenView } from "@/features/templates/list/view/TemplatesScreenView";
import { useWorkoutSession } from "@/features/workout/session/WorkoutSessionContext";

import { FullScreenLoader } from "@/shared/components/feedback/FullScreenLoader";

export default function TemplatesScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const session = useWorkoutSession();

  const { createEmptyTemplate } = useTemplateSession();

  const { state, dateReference, refresh } = useTemplatesController(
    templatesActions,
    isFocused,
  );

  const openTemplate = useCallback(
    (templateId: TemplateId) => {
      router.push({
        pathname: "/templates/[templateId]",
        params: { templateId },
      });
    },
    [router],
  );

  function openNewTemplate() {
    createEmptyTemplate();
    router.navigate("/template-editor");
  }

  const openActiveWorkout = useCallback(
    () => router.push("/workout"),
    [router],
  );

  switch (state.status) {
    case "loading":
      return (
        <FullScreenLoader
          accessibilityLabel="Loading templates"
          testID="templates-screen-loading"
        />
      );
    case "loadError":
      return <TemplatesScreenLoadError error={state.error} onRetry={refresh} />;
    case "ready":
      return (
        <TemplatesScreenView
          state={state}
          dateReference={dateReference}
          onRefresh={refresh}
          onCreateTemplate={openNewTemplate}
          onOpenTemplate={openTemplate}
          onOpenActiveWorkout={
            session.state.status === "active" ? openActiveWorkout : undefined
          }
        />
      );
  }
}
