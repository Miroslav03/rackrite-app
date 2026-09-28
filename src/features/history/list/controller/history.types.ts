import type { HistoryPage } from "@/domain/history/history.types";

type LoadOperation =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "error"; error: Error };

export type HistoryState =
  | { status: "loading" }
  | { status: "loadError"; error: Error }
  | ({
      status: "ready";
      totalCount: number;
      refresh: LoadOperation;
      pagination: LoadOperation;
      revision: number;
    } & HistoryPage);

export type HistoryAction =
  | { type: "refreshStarted" }
  | { type: "refreshSucceeded"; page: HistoryPage; totalCount: number }
  | { type: "refreshFailed"; error: Error }
  | { type: "pageStarted" }
  | { type: "pageSucceeded"; page: HistoryPage }
  | { type: "pageFailed"; error: Error }
  | { type: "interrupted" };
