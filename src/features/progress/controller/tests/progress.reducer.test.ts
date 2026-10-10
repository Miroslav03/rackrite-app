import { initialProgressState, progressReducer } from "../progress.reducer";

import { analyzeCompetitionLifts } from "@/domain/progress/analysis/progress.useCases";

it("defaults to Bench and keeps lift selection through load outcomes", () => {
  expect(initialProgressState).toMatchObject({
    selectedLift: "bench",
  });

  const selection = progressReducer(initialProgressState, {
    type: "liftSelected",
    family: "deadlift",
  });
  const ready = progressReducer(selection, {
    type: "refreshSucceeded",
    overview: analyzeCompetitionLifts([], 100),
  });
  const pending = progressReducer(ready, { type: "refreshStarted" });
  const failed = progressReducer(pending, {
    type: "refreshFailed",
    error: new Error("offline"),
  });

  expect(failed).toMatchObject({
    status: "ready",
    selectedLift: "deadlift",
    refresh: { status: "error" },
  });
  expect(
    progressReducer(failed, { type: "liftSelected", family: "squat" }),
  ).toMatchObject({ selectedLift: "squat", refresh: { status: "error" } });
});

it("keeps a failed snapshot outdated through pending and interrupted retries until success", () => {
  const overview = analyzeCompetitionLifts([], 100);
  const ready = progressReducer(initialProgressState, {
    type: "refreshSucceeded",
    overview,
  });
  const error = new Error("SQLite unavailable");
  const failed = progressReducer(ready, { type: "refreshFailed", error });
  const retrying = progressReducer(failed, { type: "refreshStarted" });

  expect(retrying).toMatchObject({
    refresh: { status: "pending", previousError: error },
  });
  expect(progressReducer(retrying, { type: "interrupted" })).toMatchObject({
    refresh: { status: "error", error },
  });
  expect(
    progressReducer(retrying, { type: "refreshSucceeded", overview }),
  ).toMatchObject({ refresh: { status: "idle" } });
});
