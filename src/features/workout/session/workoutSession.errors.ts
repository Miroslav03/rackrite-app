export type WorkoutSessionErrorCode =
  | "invalidSessionState"
  | "operationAlreadyRunning"
  | "hydrationFailed"
  | "operationFailed";

export class WorkoutSessionError extends Error {
  readonly code: WorkoutSessionErrorCode;
  readonly cause?: Error;

  constructor({
    code,
    message,
    cause,
  }: {
    code: WorkoutSessionErrorCode;
    message: string;
    cause?: Error;
  }) {
    super(message);

    this.name = "WorkoutSessionError";
    this.code = code;
    this.cause = cause;
  }
}
