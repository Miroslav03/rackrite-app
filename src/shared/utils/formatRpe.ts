export function formatRpe(rpe: number | null): string {
  if (rpe === null) return "—";

  return Number.isInteger(rpe) ? String(rpe) : rpe.toFixed(1);
}
