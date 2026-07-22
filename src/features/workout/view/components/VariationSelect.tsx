import { useMemo, useState } from "react";

import { OptionSheet } from "@/shared/components/ui/OptionSheet";
import { SelectTrigger } from "@/shared/components/ui/SelectTrigger";

type LiftFamily = "squat" | "bench" | "deadlift";

const variationsByFamily = {
  squat: [
    { id: "competition-squat", label: "Competition Squat" },
    { id: "paused-squat", label: "Paused Squat" },
    { id: "tempo-squat", label: "Tempo Squat" },
  ],
  bench: [
    { id: "competition-bench", label: "Competition Bench" },
    { id: "paused-bench", label: "Paused Bench" },
    { id: "close-grip-bench", label: "Close Grip Bench" },
  ],
  deadlift: [
    { id: "competition-deadlift", label: "Competition Deadlift" },
    { id: "pause-deadlift", label: "Pause Deadlift" },
    { id: "deficit-deadlift", label: "Deficit Deadlift" },
  ],
} satisfies Record<LiftFamily, { id: string; label: string }[]>;

type VariationSelectProps = {
  liftFamily: LiftFamily;
  value: string;
  onChange: (variationId: string) => void;
};

export function VariationSelect({
  liftFamily,
  value,
  onChange,
}: VariationSelectProps) {
  const [open, setOpen] = useState(false);

  const options = variationsByFamily[liftFamily];

  const selectedLabel = useMemo(() => {
    return (
      options.find((option) => option.id === value)?.label ?? "Select Variation"
    );
  }, [options, value]);

  return (
    <>
      <SelectTrigger value={selectedLabel} onPress={() => setOpen(true)} />

      <OptionSheet
        open={open}
        title="Select Variation"
        options={options}
        selectedId={value}
        onClose={() => setOpen(false)}
        onSelect={(option) => onChange(option.id)}
      />
    </>
  );
}
