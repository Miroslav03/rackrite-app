import * as Crypto from "expo-crypto";

export type EntityIdPrefix =
  | "workout"
  | "workout_exercise"
  | "section"
  | "set"
  | "template"
  | "template_section"
  | "template_set";

export function createId(prefix: EntityIdPrefix): string {
  return `${prefix}_${Crypto.randomUUID()}`;
}
