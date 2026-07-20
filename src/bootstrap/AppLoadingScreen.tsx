import { ActivityIndicator, View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { colors } from "@/shared/theme/tokens";

export function AppLoadingScreen() {
  return (
    <View
      className="flex-1 items-center justify-center bg-background"
      testID="app-loading-screen"
    >
      <AppText variant="logo">RackRite</AppText>

      <ActivityIndicator
        className="mt-5"
        color={colors.primarySoft}
        size="small"
      />
    </View>
  );
}
