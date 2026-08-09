import { createContext, useContext } from "react";

export type ShowToastInput = {
  message: string;
  durationMs?: number;
  onDismiss?: () => void;
};

export type ActiveToast = {
  id: number;
  message: string;
  expiresAt: number;
  onDismiss?: () => void;
};

export type ToastHostLayer = "root" | "modal";

export type ToastContextValue = {
  activeToast: ActiveToast | null;
  activeHostId: string | null;
  showToast: (input: ShowToastInput) => number;
  hideToast: (toastId: number) => void;
  dismissToast: (toastId: number) => void;
  registerHost: (hostId: string, layer: ToastHostLayer) => () => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}
