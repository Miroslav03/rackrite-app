import { useState } from "react";
import type { LiftFamily } from "@/domain/domain.types";
import type { TrendMetric } from "@/domain/progress/trends/progress.trends.types";
import { Button } from "@/shared/components/ui/Button";
import { ProgressScreenView } from "../ProgressScreenView";
import type { ProgressStoryScenario } from "./progressStory.scenarios";

type Props = {
  scenario: ProgressStoryScenario;
  initialLift?: LiftFamily;
  initialMetric?: TrendMetric;
  onSelectLift?: (lift: LiftFamily) => void;
  onSelectMetric?: (metric: TrendMetric) => void;
  onRefresh?: () => void;
};

export function ProgressStoryHost(props: Props) {
  return (
    <ScenarioPreview
      key={`${props.scenario.id}:${props.initialLift}:${props.initialMetric}`}
      {...props}
    />
  );
}

function ScenarioPreview({
  scenario,
  initialLift = "bench",
  initialMetric,
  onSelectLift,
  onSelectMetric,
  onRefresh,
}: Props) {
  const [selectedLift, selectLift] = useState<LiftFamily>(initialLift);
  const [metric, selectMetric] = useState<TrendMetric>(
    initialMetric ?? scenario.metric ?? "performance",
  );
  const [refresh, setRefresh] = useState(scenario.refresh);
  const error = new Error("Simulated Storybook refresh failure");
  const pending = refresh === "pending" || refresh === "retrying";
  function completeRefresh() {
    setRefresh(undefined);
    onRefresh?.();
  }

  return (
    <>
      {pending ? (
        <Button
          title="Complete simulated refresh"
          accessibilityRole="button"
          accessibilityLabel="Complete simulated refresh"
          onPress={completeRefresh}
        />
      ) : null}
      <ProgressScreenView
        state={{
          status: "ready",
          selectedLift,
          metric,
          overview: scenario.overview,
          refresh: pending
            ? {
                status: "pending",
                previousError: refresh === "retrying" ? error : null,
              }
            : refresh === "error"
              ? { status: "error", error }
              : { status: "idle" },
        }}
        onRefresh={completeRefresh}
        onSelectLift={(lift) => {
          selectLift(lift);
          onSelectLift?.(lift);
        }}
        onSelectMetric={(nextMetric) => {
          selectMetric(nextMetric);
          onSelectMetric?.(nextMetric);
        }}
      />
    </>
  );
}
