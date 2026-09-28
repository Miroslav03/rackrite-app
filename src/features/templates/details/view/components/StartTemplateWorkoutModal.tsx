import { DangerModal } from "@/shared/components/ui/DangerModal";

import type { TemplateDetailsOverlay } from "../../controller/useStartTemplateWorkoutController";

type StartTemplateWorkoutModalProps = {
  overlay: TemplateDetailsOverlay;
  pending: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function StartTemplateWorkoutModal({
  overlay,
  pending,
  onConfirm,
  onClose,
}: StartTemplateWorkoutModalProps) {
  switch (overlay.type) {
    case "none":
      return null;
    case "dangerModal":
      switch (overlay.confirmation.action) {
        case "startWorkoutFromTemplate":
          return (
            <DangerModal
              open
              title="Discard current workout?"
              description="Your current workout and all logged exercises and sets will be permanently deleted. The selected template will start as a new session."
              confirmLabel="Discard"
              operation={
                pending
                  ? { status: "pending", label: "Starting..." }
                  : { status: "idle" }
              }
              onConfirm={onConfirm}
              onClose={onClose}
            />
          );
      }
  }
}
