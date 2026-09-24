import { getWorkoutDurationMinutes } from "@/domain/workout/workout.utils";

import type { TemplateListItem, TemplateListRecord } from "./templates.types";

export function summarizeTemplateListItem(
  record: TemplateListRecord,
): TemplateListItem {
  const { lastExecution } = record;

  return {
    ...record,
    lastExecution:
      lastExecution === null
        ? null
        : {
            finishedAt: lastExecution.finishedAt,
            durationMinutes: getWorkoutDurationMinutes(
              lastExecution.startedAt,
              lastExecution.finishedAt,
            ),
          },
  };
}
