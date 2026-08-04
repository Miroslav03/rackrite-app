import { type ReactNode, useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

import type {
  Exercise,
  ExerciseId,
  ExerciseKind,
} from "@/domain/exercises/exercise.types";

import { exerciseActions } from "@/features/exercises/actions/exerciseActions";

import { AppText } from "@/shared/components/ui/AppText";
import { BottomSheet } from "@/shared/components/ui/BottomSheet";
import { Button } from "@/shared/components/ui/Button";
import {
  OptionList,
  type OptionListOption,
} from "@/shared/components/ui/OptionList";
import { colors } from "@/shared/theme/tokens";
import { toError } from "@/shared/utils/error";
import { formatExerciseKind } from "../utils/formatExerciseKind";

const exerciseKindOptions = [
  {
    id: "competition_lift",
    label: formatExerciseKind("competition_lift"),
  },
  {
    id: "lift_variation",
    label: formatExerciseKind("lift_variation"),
  },
  {
    id: "accessory",
    label: formatExerciseKind("accessory"),
  },
] satisfies OptionListOption<ExerciseKind>[];

type ExercisePickerState =
  | {
      status: "selectingKind";
    }
  | {
      status: "loadingExercises";
      kind: ExerciseKind;
    }
  | {
      status: "loadError";
      kind: ExerciseKind;
      error: Error;
    }
  | {
      status: "selectingExercise";
      kind: ExerciseKind;
      exercises: Exercise[];
    };

type ExercisePickerSheetProps = {
  open: boolean;
  excludedExerciseIds?: readonly ExerciseId[];
  excludedKinds?: readonly ExerciseKind[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
};

const initialExercisePickerState: ExercisePickerState = {
  status: "selectingKind",
};

export function ExercisePickerSheet({
  open,
  excludedExerciseIds = [],
  excludedKinds,
  onSelect,
  onClose,
}: ExercisePickerSheetProps) {
  const [state, setState] = useState<ExercisePickerState>(
    initialExercisePickerState,
  );

  const queryIdRef = useRef(0);

  useEffect(() => {
    if (!open) {
      queryIdRef.current += 1;
      setState(initialExercisePickerState);
    }
  }, [open]);

  async function handleKindSelected(kind: ExerciseKind) {
    const queryId = queryIdRef.current + 1;
    queryIdRef.current = queryId;

    setState({
      status: "loadingExercises",
      kind,
    });

    try {
      const exercises = await exerciseActions.loadExercisesByKind(kind);

      if (queryId !== queryIdRef.current) {
        return;
      }

      setState({
        status: "selectingExercise",
        kind,
        exercises,
      });
    } catch (error) {
      if (queryId !== queryIdRef.current) {
        return;
      }

      setState({
        status: "loadError",
        kind,
        error: toError(error),
      });
    }
  }

  function handleBack() {
    queryIdRef.current += 1;
    setState(initialExercisePickerState);
  }

  function handleClose() {
    queryIdRef.current += 1;
    setState(initialExercisePickerState);
    onClose();
  }

  let content: ReactNode;

  switch (state.status) {
    case "selectingKind":
      content = (
        <OptionList
          options={exerciseKindOptions.map((option) => ({
            ...option,
            disabled: excludedKinds?.includes(option.id),
          }))}
          onSelect={(option) => {
            void handleKindSelected(option.id);
          }}
        />
      );
      break;

    case "loadingExercises":
      content = (
        <View
          className="items-center gap-md py-xl"
          accessibilityLabel="Loading exercises"
          accessibilityRole="progressbar"
        >
          <ActivityIndicator color={colors.primarySoft} size="small" />
          <AppText variant="body">Loading exercises</AppText>
        </View>
      );
      break;

    case "loadError":
      content = (
        <View className="gap-md py-md">
          <AppText variant="body" className="text-error">
            Exercises could not be loaded.
          </AppText>
          <View className="gap-sm">
            <Button
              title="Retry"
              onPress={() => {
                void handleKindSelected(state.kind);
              }}
            />
            <Button
              title="Back"
              variant="ghost"
              intent="neutral"
              onPress={handleBack}
            />
          </View>
        </View>
      );
      break;

    case "selectingExercise": {
      const exercises = state.exercises;

      if (exercises.length === 0) {
        content = (
          <View className="gap-md py-md">
            <AppText variant="body">
              No exercises are available for this type.
            </AppText>
            <Button
              title="Back"
              variant="ghost"
              intent="neutral"
              onPress={handleBack}
            />
          </View>
        );
        break;
      }

      const exerciseOptions = exercises.map((exercise) => ({
        id: exercise.id,
        label: exercise.name,
        disabled: excludedExerciseIds?.includes(exercise.id),
      })) satisfies OptionListOption<ExerciseId>[];

      content = (
        <View className="gap-md">
          <ScrollView
            className="max-h-[520px]"
            showsVerticalScrollIndicator={false}
          >
            <OptionList
              options={exerciseOptions}
              onSelect={(option) => {
                const exercise = exercises.find(
                  (candidate) => candidate.id === option.id,
                );

                if (exercise) {
                  onSelect(exercise);
                }
              }}
            />
          </ScrollView>
        </View>
      );
      break;
    }
  }

  return (
    <BottomSheet
      open={open}
      title={
        state.status === "selectingKind"
          ? "Select Exercise Type"
          : "Select Exercise"
      }
      onClose={handleClose}
    >
      {content}
    </BottomSheet>
  );
}
