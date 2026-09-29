import { Ionicons } from "@expo/vector-icons";

import { memo, useMemo } from "react";
import { View } from "react-native";

import type { TemplateId } from "@/domain/templates/editor/templates.types";
import type { TemplateListItem } from "@/domain/templates/list/templates.types";

import { AppText } from "@/shared/components/ui/AppText";
import { Badge } from "@/shared/components/ui/Badge";
import { TemplateSurfaceCard } from "@/shared/components/ui/TemplateSurfaceCard";
import { colors } from "@/shared/theme/tokens";

import { createTemplateCardViewModel } from "../templateCard.viewModel";

export const TemplateListCard = memo(function TemplateListCard({
  template,
  dateReference,
  onOpen,
}: {
  template: TemplateListItem;
  dateReference: number;
  onOpen: (templateId: TemplateId) => void;
}) {
  const card = useMemo(
    () => createTemplateCardViewModel(template, dateReference),
    [template, dateReference],
  );

  return (
    <TemplateSurfaceCard
      testID={`template-card-${template.id}`}
      onPress={() => onOpen(template.id)}
      accessibilityLabel={`View ${template.name} details`}
      surfaceAccent="primary"
      surfaceClassName="bg-surfaceLow rounded-xl border-t border-r border-b border-t-outline/30 border-r-outline/30 border-b-outline/30"
      contentClassName="px-sm pt-sm pb-0"
      dividerClassName="mx-sm bg-outline/20"
      footerClassName="px-sm pt-md pb-sm"
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
      <View className="gap-md pb-md">
        <AppText variant="title" className="text-3xl tracking-wide">
          {card.name}
        </AppText>
        {card.description !== null ? (
          <View className="min-h-6">
            <AppText variant="body" className="text-sm font-medium">
              {card.description}
            </AppText>
          </View>
        ) : null}
      </View>
      {card.exercises.map((exercise) => (
        <View
          key={exercise.id}
          className="gap-sm border-t border-outline/20 py-md"
        >
          <AppText className="text-md font-extrabold text-foreground">
            {exercise.name}
          </AppText>
          {exercise.setBadges.length > 0 && (
            <View className="flex-row flex-wrap gap-xs">
              {exercise.setBadges.map(({ type, label }) => (
                <Badge key={type} label={label} tone={type} />
              ))}
            </View>
          )}
        </View>
      ))}
    </TemplateSurfaceCard>
  );
});
