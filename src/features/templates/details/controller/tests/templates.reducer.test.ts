import { selectTemplateDetails } from "@/domain/templates/details/templates.selectors";
import { createTemplate } from "@/domain/templates/editor/tests/templates.test.helpers";

import { templateDetailsReducer } from "../templates.reducer";
import type {
  TemplateDetailsState,
  TemplateOperation,
} from "../templates.types";

const template = selectTemplateDetails(createTemplate(), null);
const operation: TemplateOperation = {
  type: "deleteTemplate",
  templateId: template.id,
};
const ready: TemplateDetailsState = {
  status: "ready",
  template,
  operation: { status: "idle" },
};

it("supports loading, failure, retry, and an unavailable template", () => {
  const loading = templateDetailsReducer(ready, { type: "loadStarted" });
  const error = new Error("Read failed");
  const failed = templateDetailsReducer(loading, { type: "loadFailed", error });
  expect(failed).toEqual({ status: "loadError", error });

  const retrying = templateDetailsReducer(failed, { type: "loadStarted" });
  expect(
    templateDetailsReducer(retrying, { type: "loadSucceeded", template }),
  ).toEqual(ready);
  expect(
    templateDetailsReducer(retrying, {
      type: "loadSucceeded",
      template: null,
    }),
  ).toEqual({ status: "unavailable" });
});

it("starts an operation only for the loaded template without replacing pending work", () => {
  expect(
    templateDetailsReducer(ready, {
      type: "operationStarted",
      operation: { ...operation, templateId: "other" },
    }),
  ).toBe(ready);

  const pending = templateDetailsReducer(ready, {
    type: "operationStarted",
    operation,
  });
  expect(pending).toEqual({
    ...ready,
    operation: { status: "pending", operation },
  });
  expect(
    templateDetailsReducer(pending, {
      type: "operationStarted",
      operation: { ...operation },
    }),
  ).toBe(pending);
});

it.each(["operationSucceeded", "operationFailed"] as const)(
  "%s preserves the latest details and ignores another operation's completion",
  (type) => {
    const latestTemplate = { ...template, name: "Latest name" };
    const pending: TemplateDetailsState = {
      status: "ready",
      template: latestTemplate,
      operation: { status: "pending", operation },
    };
    const error = new Error("Delete failed");

    expect(
      templateDetailsReducer(pending, {
        type,
        operation: { ...operation },
        error,
      }),
    ).toBe(pending);
    expect(templateDetailsReducer(ready, { type, operation, error })).toBe(
      ready,
    );

    const next = templateDetailsReducer(pending, { type, operation, error });
    expect(next).toEqual({
      status: "ready",
      template: latestTemplate,
      operation:
        type === "operationSucceeded"
          ? { status: "idle" }
          : { status: "error", operation, error },
    });
  },
);

it("dismisses only the current error and preserves details for retry", () => {
  const error = new Error("Delete failed");
  const failed: TemplateDetailsState = {
    ...ready,
    operation: { status: "error", operation, error },
  };
  expect(
    templateDetailsReducer(failed, {
      type: "operationErrorDismissed",
      error: new Error("Delete failed"),
    }),
  ).toBe(failed);
  expect(
    templateDetailsReducer(failed, {
      type: "operationErrorDismissed",
      error,
    }),
  ).toEqual(ready);
});
