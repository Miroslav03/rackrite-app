import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, type ReactNode } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { SetType } from "@/domain/domain.types";
import {
  measureView,
  useScrollVisibility,
} from "@/shared/context/ScrollVisibilityContext";
import { SET_TYPE_CONFIG } from "@/shared/theme/setTypes";
import { colors, spacing } from "@/shared/theme/tokens";

import { AppText } from "../ui/AppText";
import { EditorOptionButton } from "../ui/EditorOptionButton";

type SetEditorDockProps = {
  exerciseName: string;
  setNumber: number;
  setCount: number;
  setType: SetType;
  panelLabel: string;
  disabled: boolean;
  headerAction?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  onDelete: () => void;
  onHeightChange: (height: number) => void;
};

export function SetEditorDock({
  exerciseName,
  setNumber,
  setCount,
  setType,
  panelLabel,
  disabled,
  headerAction,
  footer,
  children,
  onDelete,
  onHeightChange,
}: SetEditorDockProps) {
  const dockRef = useRef<View>(null);

  const insets = useSafeAreaInsets();
  const { registerOccluder, ensureVisible } = useScrollVisibility();

  useEffect(() => {
    return registerOccluder(() => measureView(dockRef.current));
  }, [registerOccluder]);

  function handleLayout(event: LayoutChangeEvent) {
    onHeightChange(event.nativeEvent.layout.height);

    requestAnimationFrame(() => {
      void ensureVisible();
    });
  }

  return (
    <View
      ref={dockRef}
      accessibilityLabel={`Set editor for ${exerciseName}, set ${setNumber}`}
      className="absolute inset-x-0 bottom-0 z-20 border-t border-outline bg-surface px-screenX pt-md"
      style={{
        elevation: 16,
        paddingBottom: Math.max(insets.bottom, spacing.lg),
      }}
      onLayout={handleLayout}
    >
      <View className="mb-md flex-row items-center justify-between gap-md">
        <View className="flex-1">
          <AppText variant="title" className="text-[14px]" numberOfLines={1}>
            {exerciseName}
          </AppText>
          <AppText variant="sectionLabel" className="mt-xs">
            Set {setNumber} of {setCount}
          </AppText>
        </View>

        <View className="flex-row items-center gap-md">
          <View className="items-end">
            <AppText variant="sectionLabel">Editing</AppText>
            <AppText
              className="text-sm font-black"
              style={{ color: SET_TYPE_CONFIG[setType].accentColor }}
            >
              {panelLabel}
            </AppText>
          </View>

          <EditorOptionButton
            variant="icon"
            accessibilityLabel={`Remove set ${setNumber}`}
            accessibilityHint="Opens a confirmation before removing this set"
            accessibilityState={{ disabled }}
            disabled={disabled}
            hitSlop={4}
            hoverBackgroundColor={colors.errorSolid}
            icon={
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            }
            onPress={onDelete}
          />

          {headerAction}
        </View>
      </View>

      <View className="mb-md">{children}</View>
      {footer}
    </View>
  );
}
