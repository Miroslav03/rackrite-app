import { Redirect } from "expo-router";

import { useTemplateSession } from "@/features/templates/editor/session/TemplateSessionContext";
import { TemplateEditorScreen } from "@/features/templates/editor/view/TemplateEditorScreen";

import { ErrorNotice } from "@/shared/components/feedback/ErrorNotice";
import { FullScreenLoader } from "@/shared/components/feedback/FullScreenLoader";
import { ScrollVisibilityProvider } from "@/shared/context/ScrollVisibilityContext";
import { Screen } from "@/shared/components/layout/Screen";

export default function TemplateEditor() {
  const { state, createEmptyTemplate, ...actions } = useTemplateSession();

  switch (state.status) {
    case "noActiveTemplate":
      return <Redirect href="/templates" />;
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
            message="Couldn't create your template."
            error={state.error}
            onRetry={createEmptyTemplate}
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
