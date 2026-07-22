import { Ionicons } from "@expo/vector-icons";

import { useState } from "react";
import { Text, View } from "react-native";

import { useWorkoutSession } from "@/features/workout/session/WorkoutSessionContext";
import { RestTimerCard } from "@/features/workout/view/components/RestTimerCard";
import { VariationSelect } from "@/features/workout/view/components/VariationSelect";
import { WorkoutSetCard } from "@/features/workout/view/components/WorkoutSetCard";

import { HeaderMetric } from "@/shared/components/layout/HeaderMetric";
import { Screen } from "@/shared/components/layout/Screen";
import { ScreenHeader } from "@/shared/components/layout/ScreenHeader";
import { ScreenSection } from "@/shared/components/layout/ScreenSection";
import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";
import { colors } from "@/shared/theme/tokens";

export default function WorkoutScreen() {
  const { state } = useWorkoutSession();
  const [activeSetId, setActiveSetId] = useState<string | null>(null);

  function selectSet(setId: string) {
    setActiveSetId(setId);
  }
  if (state.status === "loading") {
    return (
      <View style={{ padding: 16 }}>
        <Text>Loading workout...</Text>
      </View>
    );
  }

  if (state.status !== "active") {
    return (
      <View style={{ padding: 16 }}>
        <Text>No active workout found.</Text>
      </View>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="New Workout"
        subtitle="ACTIVE WORKOUT"
        rightAccessory={<HeaderMetric value="32:10" label="Duration" />}
      />
      <ScreenSection>
        <RestTimerCard time="12:22" />
      </ScreenSection>
      <ScreenSection className="mt-14">
        <View>
          <AppText variant="title" className="text-[24px]">
            Bench Press
          </AppText>
          <VariationSelect
            liftFamily="bench"
            value={"fads"}
            onChange={(variationId) => {}}
          />
        </View>
        <WorkoutSetCard
          setIndex={1}
          setType="Top Set"
          weight="100 kg"
          reps="3"
          status="completed"
          onPress={() => selectSet("set-1")}
        />

        <WorkoutSetCard
          setIndex={2}
          setType="Backoff"
          weight="95 kg"
          reps="500"
          rpe="8"
          showRpe
          status="active"
        />

        <WorkoutSetCard
          setIndex={3}
          setType="Backoff"
          weight="95 kg"
          reps="5"
          status="pending"
          onPress={() => selectSet("set-3")}
        />
        <Button
          title="Add Set"
          variant="ghost"
          intent="neutral"
          size="md"
          leftIcon={<Ionicons name="add" size={18} color={colors.muted} />}
        />
      </ScreenSection>
      <ScreenSection className="mt-auto pt-8 pb-4">
        <Button
          title="Add Section"
          variant="outline"
          intent="neutral"
          size="lg"
          leftIcon={
            <Ionicons name="barbell-outline" size={18} color={colors.muted} />
          }
        />
      </ScreenSection>
    </Screen>
  );
}
