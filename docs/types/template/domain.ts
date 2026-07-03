import { SetType } from "../values";
import { VariationId } from "../variation";

export type TemplateId = string;
export type TemplateSectionId = string;
export type TemplateSetDefinitionId = string;

export interface Template {
  id: TemplateId;
  name: string;
  description: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface TemplateSection {
  id: TemplateSectionId;
  templateId: TemplateId;
  variationId: VariationId;
  notes: string | null;
  orderIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface TemplateSetDefinition {
  id: TemplateSetDefinitionId;
  templateSectionId: TemplateSectionId;
  setIndex: number;
  type: SetType;
  sets: number;
  reps: number;
  createdAt: number;
  updatedAt: number;
}