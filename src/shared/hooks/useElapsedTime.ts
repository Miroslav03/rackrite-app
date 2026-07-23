import { useEffect, useState } from "react";

import { formatElapsedTime } from "@/shared/utils/formatElapsedTime";

const ELAPSED_TIME_UPDATE_INTERVAL_MS = 1_000;

function getFormattedElapsedTime(startedAt: number): string {
  return formatElapsedTime(Date.now() - startedAt);
}

export function useElapsedTime(startedAt: number): string {
  const [timeElapsed, setTimeElapsed] = useState(() =>
    getFormattedElapsedTime(startedAt),
  );

  useEffect(() => {
    const updateElapsedTime = () => {
      setTimeElapsed(getFormattedElapsedTime(startedAt));
    };

    updateElapsedTime();

    const intervalId = setInterval(
      updateElapsedTime,
      ELAPSED_TIME_UPDATE_INTERVAL_MS,
    );

    return () => {
      clearInterval(intervalId);
    };
  }, [startedAt]);

  return timeElapsed;
}
