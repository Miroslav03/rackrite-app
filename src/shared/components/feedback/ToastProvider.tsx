import type { ReactNode } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { View } from "react-native";

import {
  ToastContext,
  type ActiveToast,
  type ShowToastInput,
  type ToastHostLayer,
} from "./ToastContext";
import { ToastViewport } from "./ToastViewport";

const DEFAULT_DURATION_MS = 5_000;

type RegisteredHost = {
  id: string;
  priority: number;
  order: number;
};

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [activeToast, setActiveToast] = useState<ActiveToast | null>(null);
  const [activeHostId, setActiveHostId] = useState<string | null>(null);

  const activeToastRef = useRef<ActiveToast | null>(null);
  const hostsRef = useRef<RegisteredHost[]>([]);
  const nextToastIdRef = useRef(1);
  const nextHostOrderRef = useRef(1);

  const showToast = useCallback((input: ShowToastInput): number => {
    const id = nextToastIdRef.current;
    nextToastIdRef.current += 1;

    const toast: ActiveToast = {
      id,
      message: input.message,
      expiresAt: Date.now() + (input.durationMs ?? DEFAULT_DURATION_MS),
      onDismiss: input.onDismiss,
    };

    activeToastRef.current = toast;
    setActiveToast(toast);

    return id;
  }, []);

  const hideToast = useCallback((toastId: number) => {
    if (activeToastRef.current?.id !== toastId) {
      return;
    }

    activeToastRef.current = null;
    setActiveToast(null);
  }, []);

  const dismissToast = useCallback((toastId: number) => {
    const toast = activeToastRef.current;

    if (toast?.id !== toastId) {
      return;
    }

    activeToastRef.current = null;
    setActiveToast(null);
    toast.onDismiss?.();
  }, []);

  const registerHost = useCallback((hostId: string, layer: ToastHostLayer) => {
    const host: RegisteredHost = {
      id: hostId,
      priority: layer === "modal" ? 1 : 0,
      order: nextHostOrderRef.current,
    };
    nextHostOrderRef.current += 1;

    hostsRef.current = [
      ...hostsRef.current.filter((candidate) => candidate.id !== hostId),
      host,
    ];
    setActiveHostId(getTopHostId(hostsRef.current));

    return () => {
      hostsRef.current = hostsRef.current.filter(
        (candidate) => candidate.id !== hostId,
      );
      setActiveHostId(getTopHostId(hostsRef.current));
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      activeToast,
      activeHostId,
      showToast,
      hideToast,
      dismissToast,
      registerHost,
    }),
    [
      activeHostId,
      activeToast,
      dismissToast,
      hideToast,
      registerHost,
      showToast,
    ],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      <View className="flex-1">
        {children}
        <ToastViewport layer="root" />
      </View>
    </ToastContext.Provider>
  );
}

function getTopHostId(hosts: RegisteredHost[]): string | null {
  const topHost = hosts.reduce<RegisteredHost | null>((current, candidate) => {
    if (
      current === null ||
      candidate.priority > current.priority ||
      (candidate.priority === current.priority &&
        candidate.order > current.order)
    ) {
      return candidate;
    }

    return current;
  }, null);

  return topHost?.id ?? null;
}
