import { useIsFocused, useRouter } from "expo-router";

import { useTemplateSession } from "@/features/templates/editor/session/TemplateSessionContext";
import { templatesActions } from "@/features/templates/list/actions/templatesActions";
import { useTemplatesController } from "@/features/templates/list/controller/useTemplatesController";
import { TemplatesScreenLoadError } from "@/features/templates/list/view/TemplatesScreenLoadError";
import { TemplatesScreenView } from "@/features/templates/list/view/TemplatesScreenView";

import { FullScreenLoader } from "@/shared/components/feedback/FullScreenLoader";

export default function TemplatesScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();

  const { createEmptyTemplate } = useTemplateSession();

  const { state, dateReference, refresh } = useTemplatesController(
    templatesActions,
    isFocused,
  );

  function openNewTemplate() {
    createEmptyTemplate();
    router.navigate("/template-editor");
  }

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
        />
      );
  }
}
