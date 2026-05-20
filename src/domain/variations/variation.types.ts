import { LiftFamily } from "../domain.types";

export type VariationId = string;

export interface Variation {
  id: VariationId;
  family: LiftFamily;
  name: string;
}
