import { LiftFamily } from "../values";

export interface TemplateEditorValidationResult {
  hasErrors: boolean;
  nameError: string | null;
  sections: TemplateEditorSectionValidationResult[];
}

export interface TemplateEditorSectionValidationResult {
  family: LiftFamily;
  missingVariation: boolean;
  missingSetDefinitions: boolean;
  rows: TemplateEditorSetDefinitionValidationResult[];
}

export interface TemplateEditorSetDefinitionValidationResult {
  uiId: string;
  missingType: boolean;
  invalidSets: boolean;
  invalidReps: boolean;
}