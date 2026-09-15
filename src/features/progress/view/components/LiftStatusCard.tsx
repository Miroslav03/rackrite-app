import { View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { Badge } from "@/shared/components/ui/Badge";
import { SurfaceCard } from "@/shared/components/ui/SurfaceCard";
import { colors } from "@/shared/theme/tokens";

import type { ProgressViewModel } from "../progress.viewModel";

export function LiftStatusCard({
  model,
}: {
  model: ProgressViewModel["status"];
}) {
  return (
    <SurfaceCard
      className="rounded-2xl border border-outline/30 bg-surfacePanel"
      contentClassName="p-5"
      style={{ borderLeftWidth: 4, borderLeftColor: model.color }}
    >
      <View className="flex-row flex-wrap items-center justify-between gap-2 border-b border-outline/20 pb-3">
        <AppText
          variant="title"
          className="text-2xl tracking-tight font-extrabold uppercase text-foreground"
        >
          {model.title}
        </AppText>
        <View className="flex-row items-center gap-sm">
          <AppText className="text-[9px] font-bold tracking-wider">
            {model.evidence}
          </AppText>
          <Badge
            label={model.label}
            accentColor={model.color}
            tintColor={`${model.color}18`}
            className="px-2 py-1"
            textClassName="text-xs"
            style={{ borderColor: `${model.color}60` }}
          />
        </View>
      </View>
      <AppText className="mt-3 text-md font-semibold text-foreground">
        {model.summary}
      </AppText>
      {model.estimateNote ? (
        <AppText className="mt-2 text-sm">{model.estimateNote}</AppText>
      ) : null}
      <View className="mt-4 flex-row border-t border-outline/20 pt-3">
        {[
          {
            value: model.performance,
            label: "6-WEEK PERF",
            color: model.color,
          },
          { value: model.estimatedMax, label: "EST. 1RM - KG" },
          { value: model.count, label: "SESSIONS - 8 WEEKS" },
        ].map((metric) => (
          <View key={metric.label} className="min-w-0 flex-1 items-center px-1">
            <AppText
              className="text-center text-xl font-black text-foreground"
              style={{
                color: metric.color ?? colors.foreground,
                fontVariant: ["tabular-nums"],
              }}
            >
              {metric.value}
            </AppText>
            <AppText className="text-center text-xs font-bold uppercase ">
              {metric.label}
            </AppText>
          </View>
        ))}
      </View>
    </SurfaceCard>
  );
}
