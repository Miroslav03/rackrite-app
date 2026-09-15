import { View } from "react-native";

import { BarChart } from "@/shared/components/charts/BarChart";
import { AppText } from "@/shared/components/ui/AppText";
import { Badge } from "@/shared/components/ui/Badge";
import { SurfaceCard } from "@/shared/components/ui/SurfaceCard";

import type { ProgressViewModel } from "../progress.viewModel";

export function PerformanceTrendCard({
  model,
}: {
  model: ProgressViewModel["chart"];
}) {
  return (
    <SurfaceCard
      className="rounded-2xl border border-outline/30 bg-surfacePanel"
      contentClassName="p-5"
    >
      <View className="border-b border-outline/20 pb-3 flex-row flex-wrap items-start justify-between gap-2">
        <View>
          <AppText
            variant="title"
            className="text-xl tracking-tight font-extrabold uppercase"
          >
            {model.title}
          </AppText>
          <AppText className="mt-1 text-sm">LAST 8 WEEKS</AppText>
        </View>
        <Badge
          label={model.delta}
          accentColor={model.color}
          tintColor={`${model.color}18`}
          textClassName="text-xs font-black"
          className="py-1"
        />
      </View>
      <View className="pt-3">
        <BarChart
          points={model.points}
          emptyMessage={model.emptyMessage}
          caption="Eight calendar weeks. * Current week is incomplete."
        />
      </View>
      <AppText className="mt-2 text-xs">{model.basis}</AppText>
    </SurfaceCard>
  );
}
