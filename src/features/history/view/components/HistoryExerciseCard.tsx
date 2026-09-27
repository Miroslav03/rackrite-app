import { View, useWindowDimensions } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { SurfaceCard } from "@/shared/components/ui/SurfaceCard";

import type { HistoryDetailsViewModel } from "../historyDetails.viewModel";

const columns = ["Set", "Type", "Weight", "Reps", "RPE"] as const;
const widths = [2, 3, 3, 2, 2];

export function HistoryExerciseCard({
  exercise,
}: {
  exercise: HistoryDetailsViewModel["exercises"][number];
}) {
  const { fontScale } = useWindowDimensions();
  const expanded = fontScale > 1.3;

  return (
    <SurfaceCard className="bg-surfaceLow" contentClassName="p-md gap-md">
      <View>
        <AppText
          variant="title"
          className="text-xl font-extrabold uppercase tracking-wide text-foreground"
        >
          {exercise.name}
        </AppText>
        <AppText variant="subtitle" className="mt-[1px]">
          {exercise.kind}
        </AppText>
      </View>
      <View className="gap-sm">
        {!expanded && (
          <View className="flex-row px-sm">
            {columns.map((label, index) => (
              <AppText
                key={label}
                className={`text-[10px] font-bold uppercase ${label === "RPE" ? "text-white text-right" : "text-muted"}`}
                style={{ flex: widths[index] }}
              >
                {label}
              </AppText>
            ))}
          </View>
        )}
        {exercise.sets.map((set) => (
          <SurfaceCard
            key={set.id}
            testID={`history-set-${set.id}`}
            className="border rounded-md"
            style={{
              backgroundColor: set.type.tintColor,
              borderColor: `${set.type.accentColor}40`,
            }}
            contentClassName={`px-sm py-sm flex-row ${expanded ? "flex-wrap gap-y-sm" : "items-center"}`}
          >
            {[
              set.number,
              set.type.label,
              `${set.weight} kg`,
              set.reps,
              set.rpe,
            ].map((value, index) => (
              <View
                key={columns[index]}
                style={
                  expanded
                    ? { width: "50%" }
                    : { flex: widths[index], minWidth: 0 }
                }
              >
                {expanded && (
                  <AppText
                    className={`text-[10px] uppercase ${index === 4 ? "text-white" : "text-muted"}`}
                  >
                    {columns[index]}
                  </AppText>
                )}
                <AppText
                  className={`text-xs font-bold ${index === 1 ? "uppercase" : ""} ${index === 4 ? "text-white" : "text-foreground"} ${index === 4 && !expanded ? "text-right" : ""}`}
                  style={{
                    fontVariant: ["tabular-nums"],
                    ...(index === 1 ? { color: set.type.accentColor } : {}),
                  }}
                >
                  {value}
                </AppText>
              </View>
            ))}
          </SurfaceCard>
        ))}
      </View>
    </SurfaceCard>
  );
}
