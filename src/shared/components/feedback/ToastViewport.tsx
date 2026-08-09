import { useEffect, useId } from "react";

import { ToastNotification } from "./ToastNotification";
import { type ToastHostLayer, useToast } from "./ToastContext";

type ToastViewportProps = {
  layer: ToastHostLayer;
};

export function ToastViewport({ layer }: ToastViewportProps) {
  const hostId = useId();
  const { activeHostId, activeToast, dismissToast, registerHost } = useToast();

  useEffect(() => {
    return registerHost(hostId, layer);
  }, [hostId, layer, registerHost]);

  if (activeHostId !== hostId || activeToast === null) {
    return null;
  }

  return (
    <ToastNotification
      key={activeToast.id}
      message={activeToast.message}
      durationMs={Math.max(0, activeToast.expiresAt - Date.now())}
      onDismiss={() => dismissToast(activeToast.id)}
    />
  );
}
