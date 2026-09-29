import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { useCallback, useEffect, useRef } from "react";
import { FlatList, View, type ListRenderItemInfo } from "react-native";

import type { TemplateId } from "@/domain/templates/editor/templates.types";
import type { TemplateListItem } from "@/domain/templates/list/templates.types";

import { ErrorNotice } from "@/shared/components/feedback/ErrorNotice";
import { HeaderMetric } from "@/shared/components/layout/HeaderMetric";
import { Screen } from "@/shared/components/layout/Screen";
import { ScreenHeader } from "@/shared/components/layout/ScreenHeader";
import { AppText } from "@/shared/components/ui/AppText";
import {
  FLOATING_ACTION_BUTTON_SIZE,
  FloatingActionButton,
  FloatingActionGroup,
} from "@/shared/components/ui/FloatingActionButton";
import { colors, spacing } from "@/shared/theme/tokens";

import type { TemplatesState } from "../controller/templates.types";

import { TemplateListCard } from "./components/TemplateListCard";

type TemplatesScreenViewProps = {
  state: Extract<TemplatesState, { status: "ready" }>;
  dateReference: number;
  onRefresh: () => void;
  onCreateTemplate: () => void;
  onOpenTemplate: (templateId: TemplateId) => void;
  onOpenActiveWorkout?: () => void;
};

export function TemplatesScreenView({
  state,
  dateReference,
  onRefresh,
  onCreateTemplate,
  onOpenTemplate,
  onOpenActiveWorkout,
}: TemplatesScreenViewProps) {
  const listRef = useRef<FlatList<TemplateListItem>>(null);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [state.revision]);

  const renderTemplate = useCallback(
    ({ item }: ListRenderItemInfo<TemplateListItem>) => (
      <TemplateListCard
        template={item}
        dateReference={dateReference}
        onOpen={onOpenTemplate}
      />
    ),
    [dateReference, onOpenTemplate],
  );

  return (
    <Screen scroll={false} className="pt-0 pb-0">
      <FlatList
        ref={listRef}
        testID="templates-list"
        className="flex-1"
        data={state.items}
        extraData={dateReference}
        keyExtractor={(item: TemplateListItem) => item.id}
        renderItem={renderTemplate}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        refreshing={state.refresh.status === "pending"}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: spacing.xl,
          paddingBottom: FLOATING_ACTION_BUTTON_SIZE + spacing.xl * 2,
        }}
        ItemSeparatorComponent={<View className="h-lg" />}
        ListHeaderComponent={
          <View className="pb-xl">
            <ScreenHeader
              title="Templates"
              subtitle="Library"
              rightAccessory={
                <HeaderMetric
                  value={String(state.items.length)}
                  label="Saved Workouts"
                />
              }
            />
            {state.refresh.status === "error" ? (
              <ErrorNotice
                message="Couldn't refresh your templates. Your loaded templates are still available."
                error={state.refresh.error}
                onRetry={onRefresh}
              />
            ) : null}
          </View>
        }

        ListEmptyComponent={
          <View className="flex-1 justify-center">
            <AppText className="text-center text-xl font-bold text-foreground">
              No templates yet
            </AppText>
            <AppText className="text-center">
              Your saved workout templates will appear here.
            </AppText>
          </View>
        }
      />
      <FloatingActionGroup>
        {onOpenActiveWorkout ? (
          <FloatingActionButton
            intent="primary"
            accessibilityLabel="Open active workout"
            onPress={onOpenActiveWorkout}
          >
            <MaterialCommunityIcons
              name="dumbbell"
              size={24}
              color="white"
              accessible={false}
            />
          </FloatingActionButton>
        ) : null}
        <FloatingActionButton
          testID="create-template-button"
          accessibilityLabel="Create template"
          onPress={onCreateTemplate}
        >
          <Ionicons
            name="add"
            size={30}
            color={colors.primarySoft}
            accessible={false}
          />
        </FloatingActionButton>
      </FloatingActionGroup>
    </Screen>
  );
}
