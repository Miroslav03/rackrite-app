import type { DiagnosisKind } from "@/domain/progress/diagnosis/progress.diagnosis.types";
import { colors } from "@/shared/theme/tokens";
import { WhyThisStatusCard } from "../components/WhyThisStatusCard";
import {
  act,
  baseAnalysis,
  button,
  cardModel,
  dispose,
  press,
  renderCard,
  textStyles,
  viewStyles,
  visibleText,
} from "./progress.cards.test.helpers";

const diagnoses = {
  none: { kind: "none", title: null, description: null },
  fatigue: {
    kind: "fatigue",
    title: "POSSIBLE ACCUMULATED FATIGUE",
    description:
      "This pattern is consistent with accumulated fatigue: effort and recorded competition workload have risen while performance has flattened or declined.",
  },
  excessive_intensity: {
    kind: "excessive_intensity",
    title: "FREQUENT HIGH-EFFORT WORK",
    description:
      "Repeated RPE 9–10 work accompanies flat or declining performance. A lower-stress exposure may help clarify the pattern.",
  },
  insufficient_stimulus: {
    kind: "insufficient_stimulus",
    title: "LOWER RECORDED TRAINING DEMAND",
    description:
      "Competition workload or frequency is lower than in your most recent comparable productive period.",
  },
  inconsistent_training: {
    kind: "inconsistent_training",
    title: "GAPS IN RECORDED EXPOSURES",
    description:
      "Gaps in competition-lift exposures limit a continuous performance comparison.",
  },
  insufficient_evidence: {
    kind: "insufficient_evidence",
    title: "CAUSE NOT YET CLEAR",
    description:
      "RackRite does not yet have enough evidence to identify a likely cause.",
  },
} satisfies {
  [K in DiagnosisKind]: {
    kind: K;
    title: string | null;
    description: string | null;
  };
};

const rowLabels = [
  "Performance",
  "Estimated 1RM",
  "Typical recorded RPE",
  "Weekly competition volume",
];

it.each(Object.values(diagnoses))(
  "renders $kind with separate diagnosis evidence",
  async ({ kind, title, description }) => {
    const model = cardModel({
      status: {
        value: "regressing",
        reason: "confirmed_trend",
        confirmed: true,
      },
      evidence: {
        ...baseAnalysis.evidence,
        level: "strong",
        supportingDays: 4,
        consideredDays: 5,
      },
      diagnosis: {
        kind,
        evidence: kind === "insufficient_evidence" ? "weak" : "moderate",
        reasons: [],
        referenceWindow: null,
      },
    }).why;
    const renderer = await renderCard(
      <WhyThisStatusCard model={model} onInfo={jest.fn()} />,
    );
    try {
      const text = visibleText(renderer.root);
      expect(text.filter((value) => rowLabels.includes(value))).toEqual(
        rowLabels,
      );
      expect(text).toContain(
        "4 of the latest 5 performance days support this assessment against the earlier baseline.",
      );
      if (title) {
        expect(text).toContain(title);
        expect(text).toContain(description);
        expect(text).toContain(
          kind === "insufficient_evidence"
            ? "WEAK EVIDENCE"
            : "MODERATE EVIDENCE",
        );
      } else {
        for (const entry of Object.values(diagnoses))
          if (entry.title) expect(text).not.toContain(entry.title);
        expect(text.some((value) => value.endsWith(" EVIDENCE"))).toBe(false);
      }
      expect(text).not.toContain("STRONG EVIDENCE");
    } finally {
      await dispose(renderer);
    }
  },
);

it("renders signed values with midpoint bars and neutral effort and volume colors", async () => {
  const model = cardModel(
    {},
    {
      performance: {
        ...baseAnalysis.trends.performance,
        change: { status: "available", value: 5 },
      },
      raw: {
        ...baseAnalysis.trends.raw,
        change: { status: "available", value: -5 },
      },
      rpeChange: { status: "available", value: 0 },
      volumeChange: { status: "available", value: 80 },
    },
  ).why;
  const renderer = await renderCard(
    <WhyThisStatusCard model={model} onInfo={jest.fn()} />,
  );
  try {
    expect(visibleText(renderer.root)).toEqual(
      expect.arrayContaining(["↑ +5%", "↓ -5%", "− 0", "↑ +80%"]),
    );
    const styles = viewStyles(renderer.root);
    expect(
      styles.filter(
        (style) => style.left === "50%" && style.width === undefined,
      ),
    ).toHaveLength(4);
    expect(styles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          width: "25%",
          left: "50%",
          backgroundColor: colors.success,
        }),
        expect.objectContaining({
          width: "25%",
          left: "25%",
          backgroundColor: colors.error,
        }),
        expect.objectContaining({
          width: "0%",
          left: "50%",
          backgroundColor: colors.primarySoft,
        }),
        expect.objectContaining({
          width: "50%",
          left: "50%",
          backgroundColor: colors.primarySoft,
        }),
      ]),
    );
    expect(textStyles(renderer.root, "↑ +80%")).toContainEqual(
      expect.objectContaining({ color: colors.primarySoft }),
    );
    expect(textStyles(renderer.root, "− 0")).toContainEqual(
      expect.objectContaining({ color: colors.primarySoft }),
    );
  } finally {
    await dispose(renderer);
  }
});

it("keeps all unavailable rows and replaces bars with their reasons", async () => {
  const unavailable = {
    status: "unavailable" as const,
    reason: "insufficient_history" as const,
  };
  const model = cardModel(
    {
      status: {
        value: "learning",
        reason: "insufficient_history",
        confirmed: false,
      },
      diagnosis: {
        kind: "none",
        evidence: "weak",
        reasons: [],
        referenceWindow: null,
      },
    },
    {
      performance: { ...baseAnalysis.trends.performance, change: unavailable },
      raw: { ...baseAnalysis.trends.raw, change: unavailable },
      rpeChange: { status: "unavailable", reason: "missing_rpe" },
      volumeChange: { status: "unavailable", reason: "incomplete_period" },
    },
  ).why;
  const renderer = await renderCard(
    <WhyThisStatusCard model={model} onInfo={jest.fn()} />,
  );
  try {
    const text = visibleText(renderer.root);
    expect(text.filter((value) => rowLabels.includes(value))).toEqual(
      rowLabels,
    );
    expect(text.filter((value) => value.trim() === "—")).toHaveLength(4);
    expect(text).toEqual(
      expect.arrayContaining([
        "More comparable sessions needed",
        "RPE not recorded",
        "More complete weeks needed",
        "The available history is not yet sufficient for a reliable classification.",
      ]),
    );
    expect(
      viewStyles(renderer.root).some((style) => typeof style.left === "string"),
    ).toBe(false);
  } finally {
    await dispose(renderer);
  }
});

it("invokes the accessible info action once and removes a cleared diagnosis", async () => {
  const onInfo = jest.fn();
  const model = cardModel({
    diagnosis: {
      kind: "fatigue",
      evidence: "moderate",
      reasons: [],
      referenceWindow: null,
    },
  }).why;
  const renderer = await renderCard(
    <WhyThisStatusCard model={model} onInfo={onInfo} />,
  );
  try {
    const info = button(renderer.root, "How lift analysis works");
    expect(info.props.accessibilityRole).toBe("button");
    await press(info);
    expect(onInfo).toHaveBeenCalledTimes(1);
    await act(async () => {
      renderer.update(
        <WhyThisStatusCard
          model={{ ...model, diagnosis: null }}
          onInfo={onInfo}
        />,
      );
    });
    expect(visibleText(renderer.root)).not.toContain(
      "POSSIBLE ACCUMULATED FATIGUE",
    );
  } finally {
    await dispose(renderer);
  }
});

it("keeps measured performance visible alongside unavailable effort history", async () => {
  const model = cardModel(
    {},
    {
      performance: {
        ...baseAnalysis.trends.performance,
        change: { status: "available", value: 3 },
      },
      rpeChange: { status: "unavailable", reason: "partial_rpe" },
    },
  ).why;
  const renderer = await renderCard(
    <WhyThisStatusCard model={model} onInfo={jest.fn()} />,
  );
  try {
    expect(visibleText(renderer.root)).toEqual(
      expect.arrayContaining(["↑ +3%", "Partial RPE history"]),
    );
    expect(
      visibleText(renderer.root).filter((value) => rowLabels.includes(value)),
    ).toEqual(rowLabels);
    expect(viewStyles(renderer.root)).toContainEqual(
      expect.objectContaining({
        width: "15%",
        left: "50%",
        backgroundColor: colors.success,
      }),
    );
  } finally {
    await dispose(renderer);
  }
});
