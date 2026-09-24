import type { TemplateListItem } from "@/domain/templates/list/templates.types";

type LoadOperation =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "error"; error: Error };

export type TemplatesState =
  | { status: "loading" }
  | { status: "loadError"; error: Error }
  | {
      status: "ready";
      items: TemplateListItem[];
      refresh: LoadOperation;
      revision: number;
    };

export type TemplatesAction =
  | { type: "refreshStarted" }
  | { type: "refreshSucceeded"; items: TemplateListItem[] }
  | { type: "refreshFailed"; error: Error }
  | { type: "interrupted" };
