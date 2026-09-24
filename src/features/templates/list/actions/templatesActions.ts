import {
  TemplateRepository,
  templateRepository,
} from "@/data/repositories/templateRepository";

import type { TemplateListItem } from "@/domain/templates/list/templates.types";

import { loadTemplates } from "./loadTemplates";

export type TemplatesActions = {
  loadTemplates: () => Promise<TemplateListItem[]>;
};

export function createTemplatesActions(dependencies: {
  repository: TemplateRepository;
}): TemplatesActions {
  return {
    loadTemplates: () => loadTemplates(dependencies.repository),
  };
}

export const templatesActions = createTemplatesActions({
  repository: templateRepository,
});
