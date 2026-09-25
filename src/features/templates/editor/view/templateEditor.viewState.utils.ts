import { ConfirmationModalOperation } from "@/shared/components/ui/ConfirmationModal";
import { DangerModalOperation } from "@/shared/components/ui/DangerModal";
import {
  isOperationPending,
  OperationState,
} from "@/shared/state/operationState";

import {
  CreateTemplateOperations,
  EditTemplateOperations,
} from "../session/templatesSession.types";

import { TemplateEditorOverlay } from "./TemplateEditorScreen";

export function getModalContent(overlay: TemplateEditorOverlay) {
  switch (overlay.type) {
    case "dangerModal":
      switch (overlay.confirmation.action) {
        case "discardTemplate":
          return {
            title: "DISCARD TEMPLATE?",
            description:
              "This template and all added exercises and sets will be permanently discarded. This action cannot be undone.",
            confirmLabel: "DISCARD",
          };
      }
    case "confirmationModal":
    default:
      return null;
  }
}

export function getModalOperation(
  overlay: TemplateEditorOverlay,
  operation: OperationState<CreateTemplateOperations | EditTemplateOperations>,
): DangerModalOperation | ConfirmationModalOperation {
  if (!isOperationPending(operation)) {
    return { status: "idle" };
  }

  switch (overlay.type) {
    case "dangerModal":
      switch (overlay.confirmation.action) {
        case "discardTemplate":
          return operation.operation.type === "discardTemplate"
            ? { status: "pending", label: "DISCARDING..." }
            : { status: "idle" };
      }
    case "confirmationModal":
      switch (overlay.confirmation.action) {
      }
    default:
      return { status: "idle" };
  }
}
