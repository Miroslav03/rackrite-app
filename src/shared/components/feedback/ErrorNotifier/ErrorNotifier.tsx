import { useEffect } from "react";

import { OperationState } from "@/shared/state/operationState";

import { useToast } from "../ToastContext";

type ErrorNotifierProps<TOperation> = {
  operation: OperationState<TOperation>;
  isFocused: boolean;
  getErrorMessage: (operation: TOperation) => string;
  onErrorDismissed: (error: Error) => void;
};

export function ErrorNotifier<TOperation>({
  operation,
  isFocused,
  getErrorMessage,
  onErrorDismissed,
}: ErrorNotifierProps<TOperation>) {
  const { hideToast, showToast } = useToast();

  useEffect(() => {
    if (!isFocused || operation.status !== "error") {
      return;
    }

    const currentError = operation.error;
    const toastId = showToast({
      message: getErrorMessage(operation.operation),
      onDismiss: () => onErrorDismissed(currentError),
    });

    return () => {
      hideToast(toastId);
    };
  }, [
    hideToast,
    isFocused,
    onErrorDismissed,
    operation,
    showToast,
    getErrorMessage,
  ]);

  return null;
}
