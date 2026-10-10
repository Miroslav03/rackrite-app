import { Ionicons } from "@expo/vector-icons";

import { useState } from "react";
import { Pressable, View } from "react-native";

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
  const [expandedNoteKey, setExpandedNoteKey] = useState<string | null>(null);
  const unavailableNote = model.benchmark ? null : model.unavailable;
  const noteExpanded =
    unavailableNote !== null && expandedNoteKey === unavailableNote;

  return (
    <SurfaceCard
      className=" bg-surfacePanel"
      contentClassName="p-5"
      style={{ borderLeftWidth: 4, borderLeftColor: colors.primary }}
    >
      <View className="flex flex-row justify-between">
        <View className="mb-2 flex-row items-center gap-2">
          {unavailableNote ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Why this benchmark is unavailable"
              accessibilityState={{ expanded: noteExpanded }}
              hitSlop={12}
              onPress={() =>
                setExpandedNoteKey(noteExpanded ? null : unavailableNote)
              }
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.foreground}
                accessible={false}
              />
            </Pressable>
          ) : null}
          <AppText variant="subtitle" className="text-base">
            NEXT BENCHMARK
          </AppText>
        </View>
        {model.benchmark && (
          <Badge
            label={model.benchmark.evidence}
            accentColor={colors.foreground}
            tintColor={`${colors.foreground}18`}
            className="px-2 py-1"
            textClassName="text-xs"
            style={{ borderColor: `${colors.foreground}60` }}
          />
        )}
      </View>

      {noteExpanded ? (
        <SurfaceCard
          style={{ borderRightWidth: 4, borderRightColor: colors.primary }}
          className="mb-3 mt-2 rounded bg-surfaceHigh py-0"
          contentClassName="flex-row items-center gap-2 px-4 py-3"
        >
          <AppText
            className="flex-1 text-md text-foreground font-medium"
            accessibilityLiveRegion="polite"
          >
            {unavailableNote}
          </AppText>
          <Ionicons
            name="help-circle"
            size={16}
            color={colors.foreground}
            accessible={false}
          />
        </SurfaceCard>
      ) : null}

      {model.benchmark ? (
        <View>
          <AppText variant="title" className="border-b border-outline/20 pb-3">
            {model.benchmark.label}
          </AppText>

          {/*   <View className="mt-2 gap-sm flex flex-row items-center">
            <Ionicons
              name="calendar-outline"
              size={15}
              color={colors.primary}
            />
            {model.benchmark?.sources ? (
              <AppText className="text-sm">{model.benchmark.sources}</AppText>
            ) : null}
          </View> */}

          <View className="mt-4 flex-row flex-wrap items-end gap-x-lg gap-y-2">
            <AppText className="text-6xl font-black tracking-tight text-gray-300">
              {model.benchmark.weight}
              <AppText className="text-2xl font-bold text-gray-300">
                {" "}
                KG
              </AppText>
              <AppText className="text-5xl font-black text-gray-300">
                {" "}
                × {model.benchmark.reps}
              </AppText>
            </AppText>

            {model.benchmark.delta.type === "same" ? (
              <AppText className="text-3xl font-bold text-primary">
                {model.benchmark.delta.label}
              </AppText>
            ) : (
              <AppText className="text-4xl font-black text-primary">
                {model.benchmark.delta.value}
                <AppText className="text-xl font-black text-primary">
                  {model.benchmark.delta.unit}
                </AppText>
              </AppText>
            )}
          </View>

          <View className="mt-2 flex flex-col gap-sm">
            {model.benchmark.rpe ? (
              <AppText
                variant="subtitle"
                className="text-sm font-bold border-b border-outline/20 pb-3"
              >
                {model.benchmark.rpe}
              </AppText>
            ) : null}
          </View>

          <View className="mt-2 border-b border-outline/20 ">
            <AppText className="text-lg font-semibold text-foreground pb-3">
              {model.benchmark.explanation}
            </AppText>
          </View>

          <AppText variant="subtitle" className="text-sm font-bold pt-3">
            {model.benchmark.basis}
          </AppText>
        </View>
      ) : (
        <View>
          <AppText variant="title" className="border-b border-outline/20 pb-3">
            {model.title}
          </AppText>

          <View className="mt-2 gap-sm flex">
            <AppText className="text-base font-semibold text-foreground ">
              {model.description}
            </AppText>
          </View>
        </View>
      )}
    </SurfaceCard>
  );
}
