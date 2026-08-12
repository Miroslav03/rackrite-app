import { useCallback, useEffect, useRef } from "react";

export function useDebouncedCallback<TArguments extends unknown[], TResult>(
  callback: (...arguments_: TArguments) => TResult | Promise<TResult>,
  delay: number,
) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingArgumentsRef = useRef<TArguments | null>(null);
  const flushPromiseRef = useRef<Promise<TResult | undefined> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    pendingArgumentsRef.current = null;
  }, []);

  const flush = useCallback((): Promise<TResult | undefined> => {
    if (flushPromiseRef.current !== null) {
      return flushPromiseRef.current;
    }

    if (pendingArgumentsRef.current === null) {
      return Promise.resolve(undefined);
    }

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const arguments_ = pendingArgumentsRef.current;
    pendingArgumentsRef.current = null;

    const flushPromise = Promise.resolve(callbackRef.current(...arguments_));

    flushPromiseRef.current = flushPromise;

    void flushPromise.then(
      () => {
        if (flushPromiseRef.current === flushPromise) {
          flushPromiseRef.current = null;
        }
      },
      () => {
        if (flushPromiseRef.current === flushPromise) {
          flushPromiseRef.current = null;
        }
      },
    );

    return flushPromise;
  }, []);

  const schedule = useCallback(
    (...arguments_: TArguments) => {
      cancel();
      pendingArgumentsRef.current = arguments_;

      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        void flush();
      }, delay);
    },
    [cancel, delay, flush],
  );

  useEffect(() => cancel, [cancel]);

  return { schedule, flush, cancel };
}
