import { HeaderMetric } from "@/shared/components/layout/HeaderMetric";
import { useElapsedTime } from "@/shared/hooks/useElapsedTime";

type ElapsedTimeHeaderMetricProps = {
  startedAt: number;
};

export function ElapsedTimeHeaderMetric({
  startedAt,
}: ElapsedTimeHeaderMetricProps) {
  const timeElapsed = useElapsedTime(startedAt);

  return <HeaderMetric value={timeElapsed} label="Duration" />;
}
