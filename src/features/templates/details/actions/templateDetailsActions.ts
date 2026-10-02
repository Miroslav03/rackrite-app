import { templateRepository } from "@/data/repositories/templateRepository";
import { workoutRepository } from "@/data/repositories/workoutRepository";

import type { TemplateId } from "@/domain/templates/editor/templates.types";

import { deleteTemplate } from "./deleteTemplate";
import { loadTemplateDetails } from "./loadTemplateDetails";

export const templateDetailsActions = {
  deleteTemplate: (templateId: TemplateId) =>
    deleteTemplate({ repository: templateRepository }, templateId),
  loadDetails: (templateId: TemplateId) =>
    loadTemplateDetails({ templateRepository, workoutRepository }, templateId),
};

export type TemplateDetailsActions = typeof templateDetailsActions;
