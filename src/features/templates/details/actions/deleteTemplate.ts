import type { TemplateRepository } from "@/data/repositories/templateRepository";

import type { TemplateId } from "@/domain/templates/editor/templates.types";

export type DeleteTemplateDependencies = {
  repository: Pick<TemplateRepository, "deleteTemplateAggregate">;
};

export async function deleteTemplate(
  dependencies: DeleteTemplateDependencies,
  templateId: TemplateId,
): Promise<void> {
  await dependencies.repository.deleteTemplateAggregate(templateId);
}
