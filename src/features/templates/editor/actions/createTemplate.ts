import type { TemplateRepository } from "@/data/repositories/templateRepository";
import { assertTemplateCanBeSaved } from "@/domain/templates/editor/assertions/templates.contracts";
import type { TemplateAggregate } from "@/domain/templates/editor/templates.types";

export type CreateTemplateDependencies = {
  repository: Pick<TemplateRepository, "insertTemplateAggregate">;
};

export async function createTemplate(
  dependencies: CreateTemplateDependencies,
  template: TemplateAggregate,
): Promise<void> {
  assertTemplateCanBeSaved(template);

  await dependencies.repository.insertTemplateAggregate(template);
}
