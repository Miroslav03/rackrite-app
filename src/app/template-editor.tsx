import {
  Redirect,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import { useCallback } from "react";

import { useTemplateSession } from "@/features/templates/editor/session/TemplateSessionContext";
import { TemplateEditorScreen } from "@/features/templates/editor/view/TemplateEditorScreen";

import { ErrorNotice } from "@/shared/components/feedback/ErrorNotice";
import { FullScreenLoader } from "@/shared/components/feedback/FullScreenLoader";
import { Screen } from "@/shared/components/layout/Screen";
import { ScrollVisibilityProvider } from "@/shared/context/ScrollVisibilityContext";

export default function TemplateEditor() {
  const router = useRouter();
  const { state, createEmptyTemplate, editTemplate, ...actions } =
    useTemplateSession();
  const { templateId } = useLocalSearchParams<{ templateId?: string }>();

  useFocusEffect(
    useCallback(() => {
      if (state.status === "noActiveTemplate" && templateId) {
        router.dismissTo({
          pathname: "/templates/[templateId]",
          params: { templateId },
        });
      }
    }, [state.status, templateId, router]),
  );

  switch (state.status) {
    case "noActiveTemplate":
      return templateId ? null : <Redirect href="/templates" />;
    case "loading":
      return (
        <Screen scroll={false} showBackButton>
          <FullScreenLoader accessibilityLabel="Loading template" />
        </Screen>
      );
    case "loadError":
      return (
        <Screen scroll={false} showBackButton>
          <ErrorNotice
            message={
              templateId
                ? "Couldn't load your template."
                : "Couldn't create your template."
            }
            error={state.error}
            onRetry={
              templateId
                ? () => void editTemplate(templateId)
                : createEmptyTemplate
            }
          />
        </Screen>
      );
    case "create":
    case "edit":
      return (
        <ScrollVisibilityProvider key={state.activeTemplate.template.id}>
          <TemplateEditorScreen
            key={state.activeTemplate.template.id}
            state={state}
            actions={actions}
          />
        </ScrollVisibilityProvider>
      );
  }
}
