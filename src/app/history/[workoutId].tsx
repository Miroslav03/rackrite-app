import { useIsFocused, useLocalSearchParams, useRouter } from "expo-router";

import { View } from "react-native";

import { historyActions } from "@/features/history/actions/historyActions";
import { useHistoryDetailsController } from "@/features/history/controller/useHistoryDetailsController";
import { HistoryDetailsScreenView } from "@/features/history/view/HistoryDetailsScreenView";
import { useWorkoutSession } from "@/features/workout/session/WorkoutSessionContext";

import { ErrorNotice } from "@/shared/components/feedback/ErrorNotice";
import { FullScreenLoader } from "@/shared/components/feedback/FullScreenLoader";
import { Screen } from "@/shared/components/layout/Screen";
import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";

export default function HistoryDetailsScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const session = useWorkoutSession();

  const { state, retry } = useHistoryDetailsController(
    historyActions,
    useLocalSearchParams<{ workoutId: string }>().workoutId,
    isFocused,
  );

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/history");
  }

  switch (state.status) {
    case "loading":
      return (
        <Screen scroll={false} showBackButton className="pt-0 pb-0">
          <FullScreenLoader accessibilityLabel="Loading workout details" />
        </Screen>
      );
    case "loadError":
      return (
        <Screen scroll={false} showBackButton className="pt-0 pb-0">
          <ErrorNotice
            message="Couldn't load workout details."
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
              Workout unavailable
            </AppText>
            <AppText className="text-center">
              This completed workout could not be found.
            </AppText>
            <Button title="Back to History" onPress={goBack} />
          </View>
        </Screen>
      );
    case "ready":
      return (
        <HistoryDetailsScreenView workout={state.workout} session={session} />
      );
  }
}
