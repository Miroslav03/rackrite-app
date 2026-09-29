import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Keyboard } from "react-native";

import type { Result } from "@/shared/types/result";

import { useDebouncedCallback } from "./useDebouncedCallback";

type DescriptionCardOptions = {
  description: string | null;
  run: (description: string) => Result<unknown> | Promise<Result<unknown>>;
  debounceMs?: number;
  saveBlocked?: boolean;
  isEditing: boolean;
  onBeforeOpen: () => boolean | Promise<boolean>;
  onOpen: () => void;
  onClose: () => void;
};

type EditorState = {
  draft: string | null;
  save: "idle" | "pending" | "waiting" | "error";
};

export function useDescriptionCard({
  isEditing,
  description,
  debounceMs = 1000,
  saveBlocked = false,
  run,
  onBeforeOpen,
  onOpen,
  onClose,
}: DescriptionCardOptions) {
  const [editor, setEditor] = useState<EditorState>({
    draft: null,
    save: "idle",
  });

  const mountedRef = useRef(true);
  const pendingText = useRef<string | null>(null);
  const saving = useRef<Promise<boolean> | null>(null);

  const savePending = useCallback(async (): Promise<boolean> => {
    const requestedText = pendingText.current;
    while (saving.current) {
      if (!(await saving.current)) return false;
    }

    const text = pendingText.current;
    // Newer typing owns a new debounce timer.
    if (text === null || text !== requestedText) return true;

    if (saveBlocked) {
      setEditor((current) => ({ ...current, save: "waiting" }));
      return false;
    }

    const promise = (async () => {
      let saved = false;
      try {
        saved = (await run(text)).success;
      } catch {
        // Preserve the draft so the user can retry.
      }
      if (pendingText.current !== null) {
        if (saved && pendingText.current === text) pendingText.current = null;
        const save = !saved
          ? "error"
          : pendingText.current === null
            ? "idle"
            : "pending";
        setEditor((current) => ({ ...current, save }));
      }
      return saved;
    })();

    saving.current = promise;
    try {
      return await promise;
    } finally {
      if (saving.current === promise) saving.current = null;
    }
  }, [run, saveBlocked]);

  // The timer schedules saves; only one asynchronous write runs at a time.
  const { schedule, cancel: cancelDebounce } = useDebouncedCallback(() => {
    void savePending();
  }, debounceMs);

  const flush = useCallback(async () => {
    cancelDebounce();

    while (pendingText.current !== null || saving.current !== null) {
      if (!(await savePending())) return false;
    }

    return true;
  }, [cancelDebounce, savePending]);

  const openDescription = useCallback(async () => {
    if (isEditing || saveBlocked) return;
    if (!(await onBeforeOpen()) || !mountedRef.current) return;

    onOpen();
  }, [isEditing, saveBlocked, onBeforeOpen, onOpen]);

  const closeDescription = useCallback(async () => {
    if (!(await flush()) || !mountedRef.current) return false;

    Keyboard.dismiss();
    onClose();
    return true;
  }, [flush, onClose]);

  const handleDescriptionBlur = useCallback(() => {
    onClose();
    void flush();
  }, [onClose, flush]);

  const handleDescriptionBack = useCallback(() => {
    if (
      !mountedRef.current ||
      (!isEditing && pendingText.current === null && saving.current === null)
    ) {
      return false;
    }

    Keyboard.dismiss();
    handleDescriptionBlur();
    return true;
  }, [isEditing, handleDescriptionBlur]);

  const retryDescription = useCallback(() => {
    void flush();
  }, [flush]);

  const cancel = useCallback(() => {
    cancelDebounce();
    pendingText.current = null;
    setEditor({ draft: null, save: "idle" });
    Keyboard.dismiss();
    onClose();
  }, [cancelDebounce, onClose]);

  const onChangeText = useCallback(
    (text: string) => {
      pendingText.current = text;
      setEditor({ draft: text, save: "pending" });
      schedule();
    },
    [schedule],
  );

  useEffect(() => {
    if (editor.save === "waiting" && !saveBlocked) void savePending();
  }, [editor.save, saveBlocked, savePending]);

  useEffect(() => {
    if (!isEditing) return;

    const keyboard = Keyboard.addListener(
      "keyboardDidHide",
      handleDescriptionBlur,
    );
    return () => keyboard.remove();
  }, [isEditing, handleDescriptionBlur]);

  useEffect(() => {
    const appState = AppState.addEventListener("change", (state) => {
      if (state !== "active") void flush();
    });
    return () => {
      appState.remove();
    };
  }, [flush]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      pendingText.current = null;
    };
  }, []);

  return {
    value: editor.draft ?? description ?? "",
    saveFailed: editor.save === "error",
    hasPendingChanges: editor.save !== "idle",
    onChangeText,
    openDescription,
    closeDescription,
    handleDescriptionBack,
    handleDescriptionBlur,
    retryDescription,
    flush,
    cancel,
  };
}
