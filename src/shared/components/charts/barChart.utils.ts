export function barChartScale(values: readonly (number | null)[]): {
  maximum: number;
  fractions: (number | null)[];
} {
  const valid = values.filter(
    (value): value is number =>
      value !== null && Number.isFinite(value) && value >= 0,
  );
  const maximum = Math.max(0, ...valid);

  // All series have a true zero baseline, including normalized performance.
  return {
    maximum,
    fractions: values.map((value) =>
      value === null || !Number.isFinite(value) || value < 0
        ? null
        : maximum > 0
          ? value / maximum
          : 0,
    ),
  };
}
