import { ActivityIndicator, View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { colors } from "@/shared/theme/tokens";

type FullScreenLoaderProps = {
  title?: string;
  accessibilityLabel: string;
  testID?: string;
};

export function FullScreenLoader({
  title = "RackRite",
  accessibilityLabel,
  testID,
}: FullScreenLoaderProps) {
  return (
    <View
      className="flex-1 items-center justify-center bg-background"
      testID={testID}
    >
      <AppText variant="logo">{title}</AppText>

      <ActivityIndicator
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="progressbar"
        className="mt-5"
        color={colors.primarySoft}
        size="small"
      />
    </View>
  );
}
