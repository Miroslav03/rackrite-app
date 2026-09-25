export type OperationState<TOperation> =
  | { status: "idle" }
  | {
      status: "pending";
      operation: TOperation;
    }
  | {
      status: "error";
      operation: TOperation;
      error: Error;
    };

export function isOperationPending<TOperation>(
  state: OperationState<TOperation>,
): state is { status: "pending"; operation: TOperation } {
  return state.status === "pending";
}
