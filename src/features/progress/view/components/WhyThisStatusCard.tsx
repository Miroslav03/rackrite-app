import { Ionicons } from "@expo/vector-icons";

import { Pressable, View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { SurfaceCard } from "@/shared/components/ui/SurfaceCard";
import { colors } from "@/shared/theme/tokens";

import type { ProgressViewModel } from "../progress.viewModel";

export function WhyThisStatusCard({
  model,
  onInfo,
}: {
  model: ProgressViewModel["why"];
  onInfo: () => void;
}) {
  return (
    <SurfaceCard
      className="rounded-2xl border border-outline/30 bg-surfacePanel"
      contentClassName="p-5"
      style={{ borderLeftWidth: 4, borderLeftColor: colors.outline }}
    >
      <View className=" flex-row items-center justify-between border-b border-outline/20 pb-3">
        <AppText
          variant="title"
          className="text-2xl tracking-tight font-extrabold uppercase text-foreground"
        >
          WHY THIS STATUS
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="How lift analysis works"
          onPress={onInfo}
          hitSlop={12}
          className="h-8 w-8 items-center justify-center"
        >
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.muted}
          />
        </Pressable>
      </View>
      {model.rows.map((row, index) => (
        <View
          key={row.id}
          className="py-3"
          style={
            index
              ? { borderTopWidth: 1, borderTopColor: `${colors.outline}26` }
              : undefined
          }
        >
          <View className="mb-2 flex-row items-center justify-between gap-2">
            <AppText className="min-w-0 flex-1 text-md font-bold uppercase tracking-wide text-foreground">
              {row.label}
            </AppText>
            <AppText
              className="text-sm font-bold"
              style={{ color: row.color, fontVariant: ["tabular-nums"] }}
            >
              {row.direction} {row.value}
            </AppText>
          </View>
          {row.note ? (
            <AppText className="text-sm">{row.note}</AppText>
          ) : (
            <View
              importantForAccessibility="no"
              className="h-1.5 overflow-hidden rounded-full bg-surfaceHigh"
            >
              <View
                className="absolute h-full w-px bg-muted/60"
                style={{ left: "50%" }}
              />
              {row.fraction !== null ? (
                <View
                  className="absolute h-full rounded-full"
                  style={{
                    backgroundColor: row.color,
                    width: `${Math.abs(row.fraction) * 50}%`,
                    left: `${50 + Math.min(0, row.fraction) * 50}%`,
                  }}
                />
              ) : null}
            </View>
          )}
        </View>
      ))}
      <AppText className="mt-2 text-sm leading-5">{model.summary}</AppText>
      {model.diagnosis ? (
        <View className="mt-3 border-t border-outline/20 pt-3">
          <AppText className="text-[10px] font-bold tracking-wide text-foreground">
            {model.diagnosis.title}
          </AppText>
          <AppText className="mt-1 text-[9px] font-bold tracking-wide">
            {model.diagnosis.evidence}
          </AppText>
          <AppText className="mt-2 text-xs leading-5">
            {model.diagnosis.description}
          </AppText>
        </View>
      ) : null}
    </SurfaceCard>
  );
}
