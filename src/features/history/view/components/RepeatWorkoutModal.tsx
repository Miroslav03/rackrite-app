import { DangerModal } from "@/shared/components/ui/DangerModal";

import type { HistoryOverlay } from "../../controller/useRepeatWorkoutController";

type RepeatWorkoutModalProps = {
  overlay: HistoryOverlay;
  pending: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function RepeatWorkoutModal({
  overlay,
  pending,
  onConfirm,
  onClose,
}: RepeatWorkoutModalProps) {
  switch (overlay.type) {
    case "none":
      return null;
    case "dangerModal":
      switch (overlay.confirmation.action) {
        case "repeatWorkout":
          return (
            <DangerModal
              open
              title="Discard current workout?"
              description="Your current workout and all logged exercises and sets will be permanently deleted. The selected workout will start as a new session."
              confirmLabel="Discard"
              operation={
                pending
                  ? { status: "pending", label: "Repeating..." }
                  : { status: "idle" }
              }
              onConfirm={onConfirm}
              onClose={onClose}
            />
          );
      }
  }
}
