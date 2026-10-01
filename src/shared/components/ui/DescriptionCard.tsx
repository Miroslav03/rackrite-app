import {
  Platform,
  Pressable,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { colors } from "@/shared/theme/tokens";

import { useState } from "react";
import { AppText } from "./AppText";
import { SurfaceCard } from "./SurfaceCard";

type EditDescriptionCardProps = {
  mode: "edit";
  description: string | null;
  value: string;
  isEditing: boolean;
  saveFailed: boolean;
  onEdit: () => void;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  onRetry: () => void;
};

export type DescriptionCardProps =
  | EditDescriptionCardProps
  | {
      mode: "view";
      description: string | null;
    };

export function DescriptionCard(props: DescriptionCardProps) {
  if (props.mode === "edit") return <EditableDescriptionCard {...props} />;
  if (!props.description?.trim()) return null;

  return (
    <SurfaceCard accent="primary" testID="description-card">
      <AppText variant="title" className="text-xl">
        Description
      </AppText>
      <AppText className="text-foreground">{props.description}</AppText>
    </SurfaceCard>
  );
}

function EditableDescriptionCard({
  description,
  value,
  isEditing,
  saveFailed,
  onEdit,
  onChangeText,
  onBlur,
  onRetry,
}: EditDescriptionCardProps) {
  return (
    <View>
      <SurfaceCard accent="primary" testID="description-card">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit description"
          accessibilityState={{ selected: isEditing }}
          onPress={onEdit}
        >
          <View className="flex-row items-center justify-between">
            <AppText variant="title" className="text-xl">
              Description
            </AppText>

            {isEditing && (
              <AppText className="text-xs">{value.length}/100</AppText>
            )}
          </View>

          {isEditing ? (
            <DescriptionInput
              description={description}
              value={value}
              onChangeText={onChangeText}
              onBlur={onBlur}
            />
          ) : (
            <AppText className={value ? "text-foreground" : undefined}>
              {value || "Tap to add a description"}
            </AppText>
          )}
        </Pressable>

        {saveFailed && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry saving description"
            onPress={onRetry}
          >
            <AppText className="text-error mt-sm text-sm">
              Couldn’t save description. Tap to retry.
            </AppText>
          </Pressable>
        )}
      </SurfaceCard>
      {isEditing && (
        <View
          pointerEvents="none"
          className="absolute inset-0 rounded-card border"
          style={{ borderColor: colors.primarySoft }}
        />
      )}
    </View>
  );
}

// Matches text-base's 1.5rem line height with NativeWind's native 14px rem.
const DESCRIPTION_LINE_HEIGHT = 21;

function DescriptionInput({
  description,
  value,
  onChangeText,
  onBlur,
}: Pick<
  EditDescriptionCardProps,
  "description" | "value" | "onChangeText" | "onBlur"
>) {
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const { fontScale } = useWindowDimensions();

  const lineHeight = Math.ceil(DESCRIPTION_LINE_HEIGHT * fontScale);
  const growthBuffer = Math.ceil(lineHeight * 1.5);

  const input = (
    <TextInput
      autoFocus
      accessibilityLabel="Description"
      multiline
      maxLength={Math.max(100, description?.length ?? 0)}
      value={value}
      placeholder="Tap to add a description"
      placeholderTextColor={colors.muted}
      className="text-base text-foreground p-0"
      style={[
        { textAlignVertical: "top" },
        Platform.OS === "android" && {
          lineHeight: DESCRIPTION_LINE_HEIGHT,
          minHeight: lineHeight,
          height:
            contentHeight === null ? undefined : contentHeight + growthBuffer,
        },
      ]}
      onContentSizeChange={
        Platform.OS === "android"
          ? ({ nativeEvent }) => {
              const height = Math.ceil(nativeEvent.contentSize.height);
              // Reserve a line plus Android's cursor-scroll slack before Enter.
              // Measure the text, not this buffered viewport, so it can also shrink.
              if (Number.isFinite(height) && height > 0)
                setContentHeight(height);
            }
          : undefined
      }
      onChangeText={(text) => {
        // Existing long descriptions can be shortened without permitting new over-limit input.
        if (text.length > 100 && text.length >= value.length) return;
        onChangeText(text);
      }}
      onBlur={onBlur}
    />
  );

  if (Platform.OS !== "android") return input;

  return (
    <View style={{ height: contentHeight ?? undefined, overflow: "hidden" }}>
      {/* Keep the native cursor buffer without adding visible space to the card. */}
      {input}
    </View>
  );
}
