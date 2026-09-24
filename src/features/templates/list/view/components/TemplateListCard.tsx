import { Ionicons } from "@expo/vector-icons";

import { memo, useMemo } from "react";
import { View } from "react-native";

import type { TemplateListItem } from "@/domain/templates/list/templates.types";

import { AppText } from "@/shared/components/ui/AppText";
import { Badge } from "@/shared/components/ui/Badge";
import { TemplateSurfaceCard } from "@/shared/components/ui/TemplateSurfaceCard";
import { colors } from "@/shared/theme/tokens";

import { createTemplateCardViewModel } from "../templateCard.viewModel";

export const TemplateListCard = memo(function TemplateListCard({
  template,
  dateReference,
}: {
  template: TemplateListItem;
  dateReference: number;
}) {
  const card = useMemo(
    () => createTemplateCardViewModel(template, dateReference),
    [template, dateReference],
  );

  return (
    <TemplateSurfaceCard
      testID={`template-card-${template.id}`}
      surfaceAccent="primary"
      surfaceClassName="bg-surfaceLow rounded-xl border-t border-r border-b border-t-outline/30 border-r-outline/30 border-b-outline/30"
      contentClassName="px-sm pt-sm pb-xl"
      dividerClassName="mx-sm bg-outline/30"
      footerClassName="px-sm pt-xl pb-sm"
      footer={
        <View className="min-h-6 flex-row items-center justify-between gap-lg">
          <View className="flex-1 flex-row flex-wrap items-center gap-x-lg gap-y-xs">
            {card.lastExecution !== null ? (
              <>
                <AppText className="text-sm font-bold uppercase">
                  {card.lastExecution.relativeDay}
                </AppText>
                <AppText className="text-sm font-bold uppercase">
                  {card.lastExecution.duration}
                </AppText>
              </>
            ) : (
              <AppText className="text-sm font-bold uppercase">
                NO WORKOUT DATA YET
              </AppText>
            )}
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.muted}
            accessible={false}
            importantForAccessibility="no"
          />
        </View>
      }
    >
      <View className="gap-md">
        <AppText variant="logo" className="text-3xl tracking-tight">
          {card.name}
        </AppText>
        {card.description !== null ? (
          <View className="min-h-6">
            <AppText variant="body" className="text-sm font-medium">
              {card.description}
            </AppText>
          </View>
        ) : null}
        <View className="min-h-5 flex-row flex-wrap gap-sm">
          {card.liftBadges.length > 0 ? (
            card.liftBadges.map(({ id, label }) => (
              <Badge
                key={id}
                label={label}
                textClassName="text-xs uppercase tracking-wider"
                className="py-0.5"
              />
            ))
          ) : (
            <Badge
              label={"NO COMPETITION LIFTS"}
              textClassName="text-xs uppercase tracking-wider"
              className="py-0.5"
            />
          )}
        </View>
      </View>
    </TemplateSurfaceCard>
  );
});
