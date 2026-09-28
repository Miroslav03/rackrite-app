import { templateRepository } from "@/data/repositories/templateRepository";
import { workoutRepository } from "@/data/repositories/workoutRepository";
import type { TemplateId } from "@/domain/templates/editor/templates.types";
import { loadTemplateDetails } from "./loadTemplateDetails";

export const templateDetailsActions = {
  loadDetails: (templateId: TemplateId) =>
    loadTemplateDetails({ templateRepository, workoutRepository }, templateId),
};

export type TemplateDetailsActions = typeof templateDetailsActions;
