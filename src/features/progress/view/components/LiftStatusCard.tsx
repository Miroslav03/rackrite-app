import { Ionicons } from "@expo/vector-icons";

import { useState } from "react";
import { Pressable, View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { Badge } from "@/shared/components/ui/Badge";
import { SurfaceCard } from "@/shared/components/ui/SurfaceCard";
import { colors } from "@/shared/theme/tokens";
import { cn } from "@/shared/utils/cn";

import type { ProgressViewModel } from "../progress.viewModel";

export function LiftStatusCard({
  model,
}: {
  model: ProgressViewModel["status"];
}) {
  const [expandedNoteKey, setExpandedNoteKey] = useState<string | null>(null);

  const estimateNote = model.estimatedMax !== null ? model.estimateNote : null;
  const noteExpanded =
    estimateNote !== null && expandedNoteKey === estimateNote;
  const hasContentBelowSummary =
    model.performance !== null || model.estimatedMax !== null;

  return (
    <SurfaceCard
      className=" bg-surfacePanel"
      contentClassName="p-5"
      style={{ borderLeftWidth: 4, borderLeftColor: model.color }}
    >
      <View className="flex flex-row justify-between">
        <View className="mb-2 flex-row items-center gap-2">
          {estimateNote ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="About this estimated max"
              accessibilityState={{ expanded: noteExpanded }}
              hitSlop={12}
              onPress={() =>
                setExpandedNoteKey(noteExpanded ? null : estimateNote)
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
            STRENGTH NOW
          </AppText>
        </View>
        <Badge
          label={model.label}
          accentColor={model.color}
          tintColor={`${model.color}18`}
          className="px-2 py-1"
          textClassName="text-xs"
          style={{ borderColor: `${model.color}60` }}
        />
      </View>

      {noteExpanded ? (
        <SurfaceCard
          style={{
            borderRightWidth: 4,
            borderRightColor: model.color,
          }}
          className="mb-3 mt-2 rounded bg-surfaceHigh py-0"
          contentClassName="flex-row items-center gap-2 px-4 py-3"
        >
          <AppText
            className="flex-1 text-md text-foreground font-medium"
            accessibilityLiveRegion="polite"
          >
            {estimateNote}
          </AppText>
          <Ionicons
            name="time-outline"
            size={16}
            color={colors.foreground}
            accessible={false}
          />
        </SurfaceCard>
      ) : null}

      <AppText variant="title" className="border-b border-outline/20 pb-3">
        {model.title}
      </AppText>

      {model.performance !== null ? (
        <View className="mt-4 flex flex-col gap-xs">
          <AppText
            className="text-7xl font-black"
            style={{ color: model.color }}
          >
            {model.performance}
          </AppText>
          {/*           <AppText variant="subtitle" className="text-sm font-bold">
            {model.performanceLabel}
          </AppText> */}
        </View>
      ) : null}

      <AppText
        className={cn(
          "font-semibold text-foreground",
          hasContentBelowSummary
            ? "text-lg mt-2 border-b border-outline/20 pb-3"
            : "text-base mt-2",
        )}
      >
        {model.summary}
      </AppText>

      {model.estimatedMax !== null ? (
        <View className="mt-2 gap-2">
          <AppText variant="subtitle" className="text-md font-bold">
            Estimated max
          </AppText>
          <View className="flex flex-row items-end gap-sm">
            <AppText className="text-5xl font-black text-foreground">
              {model.estimatedMax}
              <AppText className="text-xl font-bold text-foreground">
                {" "}
                KG
              </AppText>
            </AppText>
            {model.estimateChange !== null ? (
              <AppText
                className="text-2xl font-extrabold"
                style={{ color: model.color }}
              >
                {model.estimateChange}
                <AppText
                  className="text-sm font-bold"
                  style={{ color: model.color }}
                >
                  {" "}
                  KG
                </AppText>
              </AppText>
            ) : null}
          </View>
        </View>
      ) : null}

      {model.performance !== null ? (
        <AppText
          variant="subtitle"
          className="mt-3 text-sm font-bold border-t border-outline/20 pt-3"
        >
          {model.basis}
        </AppText>
      ) : null}
    </SurfaceCard>
  );
}
