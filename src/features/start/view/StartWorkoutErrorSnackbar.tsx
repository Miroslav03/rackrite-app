import { View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";

type StartWorkoutErrorSnackbarProps = {
  error: Error;
};

export function StartWorkoutErrorSnackbar({
  error,
}: StartWorkoutErrorSnackbarProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      className="mt-4 rounded-card border border-errorBorder bg-errorSurface px-lg py-md"
    >
      <AppText variant="button" className="text-error">
        Couldn&apos;t start workout. Try again.
      </AppText>

      {__DEV__ ? (
        <AppText className="mt-1 text-xs text-error">{error.message}</AppText>
      ) : null}
    </View>
  );
}
