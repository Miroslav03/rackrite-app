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

export function isOperationPending<TState extends OperationState<unknown>>(
  state: TState,
): state is Extract<TState, { status: "pending" }> {
  return state.status === "pending";
}
