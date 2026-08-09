import { useEffect } from "react";

import { useToast } from "@/shared/components/feedback/ToastContext";

import type { StartEmptyWorkoutViewState } from "./startScreen.viewState";

type StartWorkoutErrorNotifierProps = {
  operation: StartEmptyWorkoutViewState;
  onErrorDismissed: (error: Error) => void;
};

export function StartWorkoutErrorNotifier({
  operation,
  onErrorDismissed,
}: StartWorkoutErrorNotifierProps) {
  const { hideToast, showToast } = useToast();

  useEffect(() => {
    if (operation.status !== "error") {
      return;
    }

    const currentError = operation.error;
    const toastId = showToast({
      message: "Couldn't start workout. Try again.",
      onDismiss: () => onErrorDismissed(currentError),
    });

    return () => {
      hideToast(toastId);
    };
  }, [hideToast, onErrorDismissed, operation, showToast]);

  return null;
}
