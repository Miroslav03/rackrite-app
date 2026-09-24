import { TemplateRepository } from "@/data/repositories/templateRepository";

import { summarizeTemplateListItem } from "@/domain/templates/list/templates.utils";

export async function loadTemplates(repository: TemplateRepository) {
  const records = await repository.getTemplateList();

  return records.map(summarizeTemplateListItem);
}
