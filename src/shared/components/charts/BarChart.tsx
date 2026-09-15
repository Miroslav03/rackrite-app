import { useState } from "react";
import { Pressable, View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { colors } from "@/shared/theme/tokens";

import { barChartScale } from "./barChart.utils";

export type BarChartPoint = {
  id: string;
  label: string;
  value: number | null;
  description: string;
  partial?: boolean;
};

export function BarChart({
  points,
  emptyMessage,
  caption = "Select a bar to see its value.",
}: {
  points: readonly BarChartPoint[];
  emptyMessage: string;
  caption?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const geometry = barChartScale(points.map((point) => point.value));

  if (geometry.fractions.every((value) => value === null))
    return (
      <View className="min-h-40 items-center justify-center">
        <AppText className="text-center text-sm">{emptyMessage}</AppText>
      </View>
    );

  const selected = points.find((point) => point.id === selectedId);

  return (
    <View>
      <AppText className="mb-2 text-[10px] text-muted">
        0 baseline - Tap a bar for its value
      </AppText>
      <View className="h-40 flex-row items-end gap-2">
        {points.map((point, index) => {
          const fraction = geometry.fractions[index];

          return (
            <Pressable
              key={point.id}
              accessibilityRole="button"
              accessibilityLabel={point.description}
              accessibilityState={{ selected: selectedId === point.id }}
              onPress={() => setSelectedId(point.id)}
              className="h-full min-w-0 flex-1 justify-end"
            >
              <View className="min-h-0 flex-1 justify-end">
                {fraction === null ? (
                  <AppText className="text-center text-xs">—</AppText>
                ) : (
                  <View
                    style={{
                      height: `${fraction * 100}%`,
                      backgroundColor: colors.primary,
                      opacity:
                        selectedId === point.id
                          ? 1
                          : 0.35 +
                            (index / Math.max(1, points.length - 1)) * 0.65,
                      borderTopLeftRadius: 2,
                      borderTopRightRadius: 2,
                      ...(point.partial
                        ? {
                            borderWidth: 1,
                            borderStyle: "dashed",
                            borderColor: colors.primarySoft,
                          }
                        : {}),
                    }}
                  />
                )}
              </View>
              <AppText
                className="mt-2 text-center text-[9px] font-bold"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {point.label}
                {point.partial ? "*" : ""}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <AppText
        accessibilityLiveRegion="polite"
        className="mt-3 min-h-8 text-sm"
      >
        {selected?.description ?? caption}
      </AppText>
    </View>
  );
}
