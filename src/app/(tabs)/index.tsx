import { AppText } from "@/shared/components/ui/AppText";
import { Screen } from "@/shared/components/layout/Screen";

export default function StartScreen() {
  return (
    <Screen>
      <AppText variant="title" className="uppercase italic tracking-tight">
        Start Workout
      </AppText>
      <AppText variant="subtitle" className="mt-2">
        Training Session Launcher
      </AppText>
    </Screen>
  );
}
