import { AppText } from "./AppText";
import { SurfaceCard } from "./SurfaceCard";

export function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <SurfaceCard
      className="flex-1 bg-surfaceLow border-l-2"
      accent="primary"
      contentClassName="p-md gap-xs"
    >
      <AppText
        variant="subtitle"
        className="text-xs font-extrabold uppercase tracking-wide"
      >
        {label}
      </AppText>
      <AppText className="text-xl font-extrabold text-foreground">
        {value}
        {unit ? (
          <AppText className="text-[10px] uppercase"> {unit}</AppText>
        ) : null}
      </AppText>
    </SurfaceCard>
  );
}
