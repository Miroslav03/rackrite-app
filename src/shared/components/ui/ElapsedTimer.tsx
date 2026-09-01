import type { ReactNode } from "react";

import { useElapsedTime } from "@/shared/hooks/useElapsedTime";

type ElapsedTimerProps = {
  startedAt: number;
  enabled?: boolean;
  children: (value: string) => ReactNode;
};

export function ElapsedTimer({
  startedAt,
  enabled,
  children,
}: ElapsedTimerProps) {
  const timeElapsed = useElapsedTime(startedAt, enabled);

  return children(timeElapsed);
}
