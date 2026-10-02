import type { TemplateDetails } from "@/domain/templates/details/templates.types";
import type { TemplateId } from "@/domain/templates/editor/templates.types";

import type { OperationState } from "@/shared/state/operationState";

export type TemplateOperation = {
  type: "deleteTemplate";
  templateId: TemplateId;
};

export type TemplateDetailsState =
  | { status: "loading" }
  | { status: "loadError"; error: Error }
  | { status: "unavailable" }
  | {
      status: "ready";
      template: TemplateDetails;
      operation: OperationState<TemplateOperation>;
    };

export type TemplateDetailsEvent =
  | { type: "loadStarted" }
  | { type: "loadSucceeded"; template: TemplateDetails | null }
  | { type: "loadFailed"; error: Error }
  | { type: "operationStarted"; operation: TemplateOperation }
  | { type: "operationSucceeded"; operation: TemplateOperation }
  | {
      type: "operationFailed";
      operation: TemplateOperation;
      error: Error;
    }
  | { type: "operationErrorDismissed"; error: Error };
