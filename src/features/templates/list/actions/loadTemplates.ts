import { TemplateRepository } from "@/data/repositories/templateRepository";

import { summarizeTemplateListItem } from "@/domain/templates/list/templates.utils";

export async function loadTemplates(
  repository: Pick<TemplateRepository, "getTemplateList">,
) {
  const records = await repository.getTemplateList();

  return records.map(summarizeTemplateListItem);
}
