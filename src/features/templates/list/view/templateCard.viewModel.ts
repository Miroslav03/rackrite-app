import type { TemplateListItem } from "@/domain/templates/list/templates.types";
import { formatRelativeDay } from "@/shared/utils/formatRelativeDay";

export function createTemplateCardViewModel(
  template: TemplateListItem,
  now: number,
) {
  return {
    name: template.name,
    description: template.description,
    liftBadges: template.competitionLifts.map(({ id, name }) => ({
      id,
      label: name,
    })),
    lastExecution:
      template.lastExecution === null
        ? null
        : {
            relativeDay: formatRelativeDay(
              template.lastExecution.finishedAt,
              now,
            ),
            duration: `${template.lastExecution.durationMinutes} min`,
          },
  };
}
