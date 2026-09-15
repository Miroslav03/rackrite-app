import { View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { Badge } from "@/shared/components/ui/Badge";
import { SurfaceCard } from "@/shared/components/ui/SurfaceCard";
import { colors } from "@/shared/theme/tokens";

import type { ProgressViewModel } from "../progress.viewModel";

export function NextActionCard({
  model,
}: {
  model: ProgressViewModel["action"];
}) {
  return (
    <SurfaceCard
      className="rounded-2xl border border-outline/30 bg-surfacePanel"
      contentClassName="p-5"
      style={{ borderLeftWidth: 4, borderLeftColor: colors.primarySoft }}
    >
      <AppText
        variant="title"
        className="text-2xl tracking-tight font-extrabold  text-primarySoft border-b border-outline/20 pb-3"
      >
        NEXT ACTION
      </AppText>
      <AppText className="pt-3 pb-2 mt-1 text-md font-black tracking-tight text-foreground">
        {model.title}
      </AppText>
      <AppText className="mt-1 text-sm leading-5">{model.description}</AppText>
      {model.benchmark ? (
        <View className="mt-4 border-t border-outline/20 pt-3">
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <AppText className="text-[10px] font-bold tracking-widest">
              {model.benchmark.label}
            </AppText>
            {model.benchmark.rpe ? (
              <Badge
                label={model.benchmark.rpe}
                tone="highlight"
                textClassName="text-[10px]"
                className="py-1"
              />
            ) : null}
          </View>
          <AppText
            className="mt-2 text-3xl font-black tracking-tight text-foreground"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {model.benchmark.value}
          </AppText>
          <AppText className="mt-2 text-sm">
            {model.benchmark.explanation}
          </AppText>
        </View>
      ) : null}
    </SurfaceCard>
  );
}
