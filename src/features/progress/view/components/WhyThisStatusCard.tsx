import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { Pressable, View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { SurfaceCard } from "@/shared/components/ui/SurfaceCard";
import { colors } from "@/shared/theme/tokens";

import { Badge } from "@/shared/components/ui/Badge";
import { evidenceIcons, type ProgressViewModel } from "../progress.viewModel";

export function WhyThisStatusCard({
  model,
  onInfo,
}: {
  model: ProgressViewModel["why"];
  onInfo: () => void;
}) {
  return (
    <SurfaceCard
      className=" bg-surfacePanel"
      contentClassName="p-5"
      style={{ borderLeftWidth: 4, borderLeftColor: "#7C8FD6" }}
    >
      <View className="flex flex-row justify-between">
        <View className="flex flex-row items-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="How lift analysis works"
            onPress={onInfo}
            hitSlop={12}
            className="h-8 w-8"
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.muted}
            />
          </Pressable>
          <AppText variant="subtitle" className="mb-2 text-base">
            WHY
          </AppText>
        </View>

        {model.diagnosis && (
          <Badge
            label={model.diagnosis.evidence}
            accentColor={colors.foreground}
            tintColor={`${colors.foreground}18`}
            className="px-2 py-1"
            textClassName="text-xs"
            style={{ borderColor: `${colors.foreground}60` }}
          />
        )}
      </View>

      <View className="border-b border-outline/20 pb-3">
        <AppText variant="title">{model.title}</AppText>

        {model.diagnosis?.reference ? (
          <View className="mt-2 flex-row items-center gap-sm">
            <Ionicons
              name="calendar-outline"
              size={15}
              color={colors.primary}
              accessible={false}
            />
            <AppText className="min-w-0 flex-1 text-base">
              {model.diagnosis.reference}
            </AppText>
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center justify-between"></View>
      {model.rows.map((row, index) => {
        const icon = evidenceIcons[row.id];
        const badgeColor =
          row.id === "strength" && row.value.startsWith("-")
            ? colors.error
            : icon.color;

        return (
          <View
            key={row.id}
            className="mt-4"
            style={
              index
                ? {
                    borderTopWidth: 1,
                    borderTopColor: `${colors.outline}26`,
                    paddingTop: 10,
                  }
                : undefined
            }
          >
            <View className="mb-2 flex-row items-center gap-2">
              <View className="min-w-0 flex-1 flex-row items-center gap-sm">
                <Ionicons name={icon.name} size={20} color={icon.color} />
                <AppText className="min-w-0 flex-1 text-xl font-bold uppercase text-foreground">
                  {row.label}
                </AppText>
              </View>

              <Badge
                label={row.value}
                accentColor={badgeColor}
                tintColor={`${badgeColor}18`}
                className="shrink-0 self-center px-2 py-1"
                textClassName="text-sm"
              />
            </View>
            {row.note ? (
              <AppText className="text-sm">{row.note}</AppText>
            ) : null}
          </View>
        );
      })}

      {model.diagnosis ? (
        <View className="mt-4 border-t border-outline/20 pt-3">
          <View className="flex-row items-center gap-sm">
            <MaterialCommunityIcons
              name="brain"
              size={20}
              color={colors.primarySoft}
              accessible={false}
            />
            <AppText className="min-w-0 flex-1 text-xl font-bold uppercase text-foreground">
              {model.diagnosis.title}
            </AppText>
          </View>

          <AppText className="mt-2 text-sm leading-5">
            {model.diagnosis.description}
          </AppText>
        </View>
      ) : null}
    </SurfaceCard>
  );
}
