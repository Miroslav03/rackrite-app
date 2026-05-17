import { LiftFamily } from "./values";

export type VariationId = string

export interface Variation {
  id:VariationId
  family: LiftFamily;
  name: string;
}