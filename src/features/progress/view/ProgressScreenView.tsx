import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useMemo, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";

import type { LiftFamily } from "@/domain/domain.types";

import { ErrorNotice } from "@/shared/components/feedback/ErrorNotice";
import { Screen } from "@/shared/components/layout/Screen";
import { ScreenHeader } from "@/shared/components/layout/ScreenHeader";
import {
  FLOATING_ACTION_BUTTON_SIZE,
  FloatingActionButton,
  FloatingActionGroup,
} from "@/shared/components/ui/FloatingActionButton";
import { SegmentedControl } from "@/shared/components/ui/SegmentedControl";
import { colors, spacing } from "@/shared/theme/tokens";

import type { ProgressState } from "../controller/progress.types";

import { LiftStatusCard } from "./components/LiftStatusCard";
import { NextActionCard } from "./components/NextActionCard";
import { ProgressAnalysisInfoSheet } from "./components/ProgressAnalysisInfoSheet";
import { WhyThisStatusCard } from "./components/WhyThisStatusCard";
import { createProgressViewModel } from "./progress.viewModel";

export function ProgressScreenView({
  state,
  onRefresh,
  onSelectLift,
  onOpenActiveWorkout,
  isFocused = true,
}: {
  state: Extract<ProgressState, { status: "ready" }>;
  onRefresh: () => void;
  onSelectLift: (family: LiftFamily) => void;
  onOpenActiveWorkout?: () => void;
  isFocused?: boolean;
}) {
  const [infoOpen, setInfoOpen] = useState(false);
  const cardKey = `${state.selectedLift}:${isFocused}`;

  const refreshError =
    state.refresh.status === "error"
      ? state.refresh.error
      : state.refresh.status === "pending"
        ? state.refresh.previousError
        : null;
  const outdated = refreshError !== null;

  const model = useMemo(
    () => createProgressViewModel(state.overview, state.selectedLift, outdated),
    [state.overview, state.selectedLift, outdated],
  );

  return (
    <Screen scroll={false} className="pt-0 pb-0">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: spacing.xl,
          paddingBottom: onOpenActiveWorkout
            ? FLOATING_ACTION_BUTTON_SIZE + spacing.xl * 2
            : spacing.xl,
          gap: spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={state.refresh.status === "pending"}
            onRefresh={onRefresh}
            tintColor={colors.primarySoft}
          />
        }
      >
        <ScreenHeader
          title="Progress"
          subtitle="Strength, evidence and your next benchmark"
        />

        {refreshError ? (
          <ErrorNotice
            message="Couldn't refresh Progress. These results are outdated; benchmarks are hidden until refresh succeeds."
            error={refreshError}
            onRetry={onRefresh}
          />
        ) : null}

        <SegmentedControl
          accessibilityLabel="Competition lift"
          value={state.selectedLift}
          onChange={(family) => {
            setInfoOpen(false);
            onSelectLift(family);
          }}
          options={model.selector.map((option) => ({
            value: option.value,
            label: option.label,
            accessibilityLabel: `${option.label}, ${option.status}`,
          }))}
        />

        <LiftStatusCard key={`status:${cardKey}`} model={model.status} />
        <NextActionCard key={`action:${cardKey}`} model={model.action} />
        <WhyThisStatusCard model={model.why} onInfo={() => setInfoOpen(true)} />
      </ScrollView>

      {onOpenActiveWorkout ? (
        <FloatingActionGroup>
          <FloatingActionButton
            intent="primary"
            accessibilityLabel="Open active workout"
            onPress={onOpenActiveWorkout}
          >
            <MaterialCommunityIcons
              name="dumbbell"
              size={24}
              color="white"
              accessible={false}
            />
          </FloatingActionButton>
        </FloatingActionGroup>
      ) : null}

      {infoOpen ? (
        <ProgressAnalysisInfoSheet
          open
          paragraphs={model.methods}
          onClose={() => setInfoOpen(false)}
        />
      ) : null}
    </Screen>
  );
}
