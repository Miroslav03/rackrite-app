import { View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";

type HistoryErrorNoticeProps = {
  message: string;
  error: Error;
  onRetry: () => void;
};

export function HistoryErrorNotice({
  message,
  error,
  onRetry,
}: HistoryErrorNoticeProps) {
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
