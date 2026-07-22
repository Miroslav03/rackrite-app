import { FullScreenLoader } from "@/shared/components/feedback/FullScreenLoader";

export function AppLoadingScreen() {
  return (
    <FullScreenLoader
      accessibilityLabel="Loading application"
      testID="app-loading-screen"
    />
  );
}
