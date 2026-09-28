import { useIsFocused, useLocalSearchParams, useRouter } from "expo-router";

import { View } from "react-native";

import { templateDetailsActions } from "@/features/templates/details/actions/templateDetailsActions";
import { useTemplateDetailsController } from "@/features/templates/details/controller/useTemplateDetailsController";
import { TemplateDetailsScreenView } from "@/features/templates/details/view/TemplateDetailsScreenView";
import { useWorkoutSession } from "@/features/workout/session/WorkoutSessionContext";

import { ErrorNotice } from "@/shared/components/feedback/ErrorNotice";
import { FullScreenLoader } from "@/shared/components/feedback/FullScreenLoader";
import { Screen } from "@/shared/components/layout/Screen";
import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";

export default function TemplateDetailsScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const session = useWorkoutSession();

  const { state, retry, dateReference } = useTemplateDetailsController(
    templateDetailsActions,
    useLocalSearchParams<{ templateId: string }>().templateId,
    isFocused,
  );

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/templates");
  }

  switch (state.status) {
    case "loading":
      return (
        <Screen scroll={false} showBackButton className="pt-0 pb-0">
          <FullScreenLoader accessibilityLabel="Loading template details" />
        </Screen>
      );
    case "loadError":
      return (
        <Screen scroll={false} showBackButton className="pt-0 pb-0">
          <ErrorNotice
            message="Couldn't load template details."
            error={state.error}
            onRetry={retry}
          />
        </Screen>
      );
    case "unavailable":
      return (
        <Screen scroll={false} showBackButton className="pt-0 pb-0">
          <View className="flex-1 justify-center gap-lg">
            <AppText className="text-center text-xl font-bold text-foreground">
              Template unavailable
            </AppText>
            <AppText className="text-center">
              This saved template could not be found.
            </AppText>
            <Button title="Back to Templates" onPress={goBack} />
          </View>
        </Screen>
      );
    case "ready":
      return (
        <TemplateDetailsScreenView
          key={state.template.id}
          template={state.template}
          session={session}
          dateReference={dateReference}
        />
      );
  }
}
