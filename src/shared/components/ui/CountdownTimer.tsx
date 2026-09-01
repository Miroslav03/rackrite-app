import type { ReactNode } from "react";

import { useCountdownTime } from "@/shared/hooks/useCountdownTime";

type CountdownTimerProps = {
  endsAt: number;
  enabled?: boolean;
  onExpire?: () => void;
  children: (value: string) => ReactNode;
};

export function CountdownTimer({
  endsAt,
  enabled,
  onExpire,
  children,
}: CountdownTimerProps) {
  const timeRemaining = useCountdownTime(endsAt, enabled, onExpire);

  return children(timeRemaining);
}
