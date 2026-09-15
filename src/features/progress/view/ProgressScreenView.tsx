import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";

import type { LiftFamily } from "@/domain/domain.types";
import type { TrendMetric } from "@/domain/progress/trends/progress.trends.types";

import { ErrorNotice } from "@/shared/components/feedback/ErrorNotice";
import { Screen } from "@/shared/components/layout/Screen";
import { ScreenHeader } from "@/shared/components/layout/ScreenHeader";
import { SegmentedControl } from "@/shared/components/ui/SegmentedControl";
import { colors } from "@/shared/theme/tokens";

import { LiftStatusCard } from "./components/LiftStatusCard";
import { NextActionCard } from "./components/NextActionCard";
import { PerformanceTrendCard } from "./components/PerformanceTrendCard";
import { ProgressAnalysisInfoSheet } from "./components/ProgressAnalysisInfoSheet";
import { WhyThisStatusCard } from "./components/WhyThisStatusCard";
import { createProgressViewModel } from "./progress.viewModel";

import type { ProgressState } from "../controller/progress.types";

export function ProgressScreenView({
  state,
  onRefresh,
  onSelectLift,
  onSelectMetric,
}: {
  state: Extract<ProgressState, { status: "ready" }>;
  onRefresh: () => void;
  onSelectLift: (family: LiftFamily) => void;
  onSelectMetric: (metric: TrendMetric) => void;
}) {
  const [infoOpen, setInfoOpen] = useState(false);

  const refreshError =
    state.refresh.status === "error"
      ? state.refresh.error
      : state.refresh.status === "pending"
        ? state.refresh.previousError
        : null;
  const outdated = refreshError !== null;

  const model = useMemo(
    () =>
      createProgressViewModel(
        state.overview,
        state.selectedLift,
        state.metric,
        outdated,
      ),
    [state.overview, state.selectedLift, state.metric, outdated],
  );

  return (
    <Screen scroll={false} className="pt-0 pb-0">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 24, gap: 16 }}
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
          subtitle="Performance analytics and trends"
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
        <LiftStatusCard model={model.status} />
        <NextActionCard model={model.action} />
        <WhyThisStatusCard model={model.why} onInfo={() => setInfoOpen(true)} />
        <View className="gap-4">
          <SegmentedControl
            accessibilityLabel="Trend metric"
            value={state.metric}
            onChange={onSelectMetric}
            options={[
              { value: "performance", label: "Performance" },
              { value: "e1rm", label: "E1RM" },
              { value: "volume", label: "Volume" },
            ]}
          />
          <PerformanceTrendCard
            key={`${state.selectedLift}:${state.metric}:${state.overview.analysisTime}`}
            model={model.chart}
          />
        </View>
      </ScrollView>
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
