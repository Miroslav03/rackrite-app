export type Result<TValue, TError = Error> =
  | {
      success: true;
      value: TValue;
    }
  | {
      success: false;
      error: TError;
    };

export function success<TValue>(value: TValue): Result<TValue, never> {
  return {
    success: true,
    value,
  };
}

export function failure<TError>(error: TError): Result<never, TError> {
  return {
    success: false,
    error,
  };
}
