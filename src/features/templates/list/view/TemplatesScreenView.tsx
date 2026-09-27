import { Ionicons } from "@expo/vector-icons";

import { useCallback, useEffect, useRef } from "react";
import {
  FlatList,
  Pressable,
  View,
  type ListRenderItemInfo,
} from "react-native";

import type { TemplateListItem } from "@/domain/templates/list/templates.types";

import { ErrorNotice } from "@/shared/components/feedback/ErrorNotice";
import { Screen } from "@/shared/components/layout/Screen";
import { AppText } from "@/shared/components/ui/AppText";
import { colors, spacing } from "@/shared/theme/tokens";

import type { TemplatesState } from "../controller/templates.types";

import { HeaderMetric } from "@/shared/components/layout/HeaderMetric";
import { ScreenHeader } from "@/shared/components/layout/ScreenHeader";
import { TemplateListCard } from "./components/TemplateListCard";

type TemplatesScreenViewProps = {
  state: Extract<TemplatesState, { status: "ready" }>;
  dateReference: number;
  onRefresh: () => void;
  onCreateTemplate: () => void;
};

const CREATE_BUTTON_SIZE = 56;

export function TemplatesScreenView({
  state,
  dateReference,
  onRefresh,
  onCreateTemplate,
}: TemplatesScreenViewProps) {
  const listRef = useRef<FlatList<TemplateListItem>>(null);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [state.revision]);

  const renderTemplate = useCallback(
    ({ item }: ListRenderItemInfo<TemplateListItem>) => (
      <TemplateListCard template={item} dateReference={dateReference} />
    ),
    [dateReference],
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
          paddingBottom:
            state.items.length > 0
              ? CREATE_BUTTON_SIZE + spacing.xl * 2
              : spacing.lg,
        }}
        ItemSeparatorComponent={<View className="h-xl" />}

        ListHeaderComponent={
          <View className="pb-12">
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
      <Pressable
        testID="create-template-button"
        accessibilityRole="button"
        accessibilityLabel="Create template"
        onPress={onCreateTemplate}
        className="absolute items-center justify-center rounded-full border border-outline/30 bg-surfaceHigh/80"
        style={{
          width: CREATE_BUTTON_SIZE,
          height: CREATE_BUTTON_SIZE,
          right: spacing.screenX,
          bottom: spacing.xl,
        }}
      >
        <Ionicons
          name="add"
          size={30}
          color={colors.primarySoft}
          accessible={false}
        />
      </Pressable>
    </Screen>
  );
}
