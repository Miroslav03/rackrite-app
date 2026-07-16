import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/shared/components/layout/Screen";
import { ScreenHeader } from "@/shared/components/layout/ScreenHeader";
import { ScreenSection } from "@/shared/components/layout/ScreenSection";
import { Button } from "@/shared/components/ui/Button";
import { colors } from "@/shared/theme/tokens";

export default function StartScreen() {
  return (
    <Screen>
      <ScreenHeader
        title="Start Workout"
        subtitle="Training Session Launcher"
      />
      <ScreenSection title="Start Options" className="mt-auto pt-8">
        <Button
          title="Start With Template"
          variant="outline"
          intent="neutral"
          size="lg"
          leftIcon={
            <Ionicons
              name="copy-outline"
              size={22}
              color={colors.primarySoft}
            />
          }
        />

        <Button
          title="Quick Start (Empty)"
          variant="ghost"
          intent="neutral"
          size="md"
        />
      </ScreenSection>
    </Screen>
  );
}
