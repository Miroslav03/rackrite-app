import { LiftFamily, SetType } from "../values";
import { VariationId } from "../variation";
import { TemplateId, TemplateSectionId, TemplateSetDefinitionId } from "./domain";

export type TemplateCardBadge = 'new_pr'
export type TemplateEditorMode = "create" | "edit";

export interface TemplateCardView {
  templateId: TemplateId;
  name: string;
  description: string | null;
  liftFamilies: LiftFamily[];
  lastUsedAt: number | null;
  estimatedDurationMin: number | null;
  badge: TemplateCardBadge | null;
}

export interface TemplateEditorScreenState {
  mode: TemplateEditorMode;
  templateId: TemplateId | null;
  name: string;
  description: string;
  sections: TemplateEditorSectionState[];
}

export interface TemplateEditorSectionState {
  sectionId: TemplateSectionId | null;
  family: LiftFamily;
  enabled: boolean;
  variationId: VariationId | null;
  notes: string; 
  setDefinitions: TemplateEditorSetDefinitionState[];
}

export interface TemplateEditorSetDefinitionState {
  uiId: string;
  setDefinitionId: TemplateSetDefinitionId | null;
  type: SetType | null;
  setsInput: string;
  repsInput: string;
}