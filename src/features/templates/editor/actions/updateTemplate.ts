import type { TemplateRepository } from "@/data/repositories/templateRepository";
import { assertTemplateCanBeSaved } from "@/domain/templates/editor/assertions/templates.contracts";
import type { TemplateAggregate } from "@/domain/templates/editor/templates.types";

export type UpdateTemplateDependencies = {
  repository: Pick<TemplateRepository, "updateTemplateAggregate">;
};

export async function updateTemplate(
  dependencies: UpdateTemplateDependencies,
  previous: TemplateAggregate,
  next: TemplateAggregate,
): Promise<void> {
  if (previous.template.id !== next.template.id) {
    throw new Error("Cannot update a template using a different template ID");
  }

  assertTemplateCanBeSaved(previous);
  assertTemplateCanBeSaved(next);

  await dependencies.repository.updateTemplateAggregate(previous, next);
}
