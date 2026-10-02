import type { TemplateRepository } from "@/data/repositories/templateRepository";
import type {
  TemplateAggregate,
  TemplateId,
} from "@/domain/templates/editor/templates.types";

export type LoadTemplateDependencies = {
  repository: Pick<TemplateRepository, "getTemplateAggregateById">;
};

export async function loadTemplate(
  dependencies: LoadTemplateDependencies,
  templateId: TemplateId,
): Promise<TemplateAggregate> {
  const template =
    await dependencies.repository.getTemplateAggregateById(templateId);

  if (!template) throw new Error("Template not found");

  return template;
}
