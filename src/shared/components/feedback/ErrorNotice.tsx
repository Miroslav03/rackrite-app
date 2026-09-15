import { View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";

export function ErrorNotice({
  message,
  error,
  onRetry,
}: {
  message: string;
  error: Error;
  onRetry: () => void;
}) {
  return (
    <View className="gap-md py-lg">
      <AppText accessibilityRole="alert" className="text-center text-error">
        {message}
      </AppText>
      {__DEV__ ? (
        <AppText className="text-center text-xs text-error">
          {error.message}
        </AppText>
      ) : null}
      <Button
        title="Try Again"
        accessibilityRole="button"
        onPress={onRetry}
        variant="outline"
        intent="neutral"
      />
    </View>
  );
}
