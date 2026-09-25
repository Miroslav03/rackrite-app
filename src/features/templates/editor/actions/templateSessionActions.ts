import type {
  TemplateAggregate,
  TemplateId,
} from "@/domain/templates/editor/templates.types";
import { createEmptyTemplate } from "@/domain/templates/editor/templates.useCases";

import { createId } from "@/shared/utils/id";

export type TemplateSessionActions = {
  createEmptyTemplate: () => TemplateAggregate;
};

export function createTemplateSessionActions(dependencies: {
  now: () => number;
  createTemplateId: () => TemplateId;
}): TemplateSessionActions {
  return {
    createEmptyTemplate: () =>
      createEmptyTemplate({
        id: dependencies.createTemplateId(),
        now: dependencies.now(),
      }),
  };
}

export const templateSessionActions = createTemplateSessionActions({
  now: Date.now,
  createTemplateId: () => createId("template"),
});
