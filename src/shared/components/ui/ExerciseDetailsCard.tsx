import { View, useWindowDimensions } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { SurfaceCard } from "@/shared/components/ui/SurfaceCard";

import type { SET_TYPE_CONFIG } from "@/shared/theme/setTypes";

export type ExerciseDetails = {
  id: string;
  name: string;
  kind: string;
  sets: {
    id: string;
    number: string;
    type: (typeof SET_TYPE_CONFIG)[keyof typeof SET_TYPE_CONFIG];
    weight?: string;
    reps: string;
    rpe: string;
  }[];
};

const allColumns = [
  { key: "number", label: "Set", width: 2 },
  { key: "type", label: "Type", width: 3 },
  { key: "weight", label: "Weight", width: 3 },
  { key: "reps", label: "Reps", width: 2 },
  { key: "rpe", label: "RPE", width: 2 },
] as const;

export function ExerciseDetailsCard({
  exercise,
  showWeight = true,
  setTestIdPrefix = "details-set",
}: {
  exercise: ExerciseDetails;
  showWeight?: boolean;
  setTestIdPrefix?: string;
}) {
  const { fontScale } = useWindowDimensions();

  const expanded = fontScale > 1.3;
  const columns = allColumns.filter(
    (column) => showWeight || column.key !== "weight",
  );

  return (
    <SurfaceCard className="bg-surfaceLow" contentClassName="p-md gap-md">
      <View>
        <AppText
          variant="title"
          className="text-2xl font-extrabold uppercase tracking-wide text-foreground"
        >
          {exercise.name}
        </AppText>
        <AppText variant="subtitle" className="mt-[1px]">
          {exercise.kind}
        </AppText>
      </View>
      <View className="gap-xs">
        {!expanded && (
          <View className="flex-row px-sm">
            {columns.map(({ key, label, width }) => (
              <AppText
                key={key}
                className={`text-xs font-bold uppercase ${key === "rpe" ? "text-white text-right" : "text-muted"}`}
                style={{ flex: width }}
              >
                {label}
              </AppText>
            ))}
          </View>
        )}
        {exercise.sets.map((set) => (
          <SurfaceCard
            key={set.id}
            testID={`${setTestIdPrefix}-${set.id}`}
            className="rounded-md"
            style={{
              backgroundColor: set.type.tintColor,
              borderColor: `${set.type.accentColor}40`,
            }}
            contentClassName={`px-sm py-sm flex-row ${expanded ? "flex-wrap gap-y-sm" : "items-center"}`}
          >
            {columns.map(({ key, label, width }) => (
              <View
                key={key}
                style={
                  expanded ? { width: "50%" } : { flex: width, minWidth: 0 }
                }
              >
                {expanded && (
                  <AppText
                    className={`text-[10px] uppercase ${key === "rpe" ? "text-white" : "text-muted"}`}
                  >
                    {label}
                  </AppText>
                )}
                <AppText
                  className={`text-xs font-bold ${key === "type" ? "uppercase" : ""} ${key === "rpe" ? "text-white" : "text-foreground"} ${key === "rpe" && !expanded ? "text-right" : ""}`}
                  style={{
                    ...(key === "type" ? { color: set.type.accentColor } : {}),
                  }}
                >
                  {key === "type"
                    ? set.type.label
                    : key === "weight"
                      ? `${set.weight ?? "—"} kg`
                      : set[key]}
                </AppText>
              </View>
            ))}
          </SurfaceCard>
        ))}
      </View>
    </SurfaceCard>
  );
}
