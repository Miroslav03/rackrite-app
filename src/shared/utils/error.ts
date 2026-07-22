export function toError(
  value: unknown,
  fallbackMessage = "An unknown error occurred",
): Error {
  if (value instanceof Error) {
    return value;
  }

  if (typeof value === "string") {
    return new Error(value);
  }

  return new Error(fallbackMessage);
}
