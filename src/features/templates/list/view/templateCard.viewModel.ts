import type { TemplateListItem } from "@/domain/templates/list/templates.types";

import { SET_TYPE_CONFIG, SET_TYPE_ORDER } from "@/shared/theme/setTypes";
import { formatRelativeDay } from "@/shared/utils/formatRelativeDay";

export function createTemplateCardViewModel(
  template: TemplateListItem,
  now: number,
) {
  return {
    name: template.name,
    description: template.description,
    exercises: template.exercises.map(({ id, name, setTypes }) => ({
      id,
      name,
      setBadges: SET_TYPE_ORDER.filter((type) => setTypes.includes(type)).map(
        (type) => ({
          type,
          label: type === "top" ? "Top" : SET_TYPE_CONFIG[type].label,
        }),
      ),
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
