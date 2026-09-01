import { useEffect, useRef, useState } from "react";

import { formatCountdownTime } from "@/shared/utils/formatCountdownTime";

const COUNTDOWN_UPDATE_INTERVAL_MS = 1_000;

function getFormattedCountdownTime(endsAt: number): string {
  return formatCountdownTime(endsAt - Date.now());
}

export function useCountdownTime(
  endsAt: number,
  enabled: boolean = true,
  onExpire?: () => void,
): string {
  const [timeRemaining, setTimeRemaining] = useState(() =>
    getFormattedCountdownTime(endsAt),
  );
  const onExpireRef = useRef(onExpire);
  const notifiedExpiryRef = useRef<number | null>(null);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!enabled) {
      notifiedExpiryRef.current = null;
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const updateCountdown = (): boolean => {
      const remainingMilliseconds = endsAt - Date.now();

      setTimeRemaining(formatCountdownTime(remainingMilliseconds));

      if (remainingMilliseconds > 0) {
        return true;
      }

      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }

      if (notifiedExpiryRef.current !== endsAt) {
        notifiedExpiryRef.current = endsAt;
        onExpireRef.current?.();
      }

      return false;
    };

    if (updateCountdown()) {
      intervalId = setInterval(updateCountdown, COUNTDOWN_UPDATE_INTERVAL_MS);
    }

    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [enabled, endsAt]);

  return timeRemaining;
}
