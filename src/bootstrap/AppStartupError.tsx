import { View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";

type AppStartupErrorProps = {
  onRetry: () => void;
  error: Error;
  showDetails?: boolean;
};

export function AppStartupError({
  onRetry,
  error,
  showDetails = __DEV__,
}: AppStartupErrorProps) {
  return (
    <View
      className="flex-1 items-center justify-center bg-background px-screenX"
      testID="database-startup-error"
    >
      <AppText variant="title" className="text-center">
        RackRite couldn&apos;t start
      </AppText>
      <AppText className="mt-md text-center">
        Close and reopen the app to try again.
      </AppText>

      <Button
        title="Try again"
        onPress={onRetry}
        variant="solid"
        intent="primary"
        className="mt-xl w-full"
        testID="startup-retry-button"
      />

      {showDetails ? (
        <AppText
          className="mt-lg text-center text-error"
          testID="startup-error-details"
        >
          {error.message}
        </AppText>
      ) : null}
    </View>
  );
}
