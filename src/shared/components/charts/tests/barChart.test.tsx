import { type ReactElement } from "react";

import { BarChart } from "../BarChart";
import { barChartScale } from "../barChart.utils";

type Node = {
  props: Record<string, unknown>;
  children: (Node | string)[];
  findAllByProps(props: Record<string, unknown>): Node[];
};

type Renderer = {
  root: Node;
  unmount(): void;
  update(element: ReactElement): void;
  toJSON(): unknown;
};

const { act, create } = jest.requireActual<{
  act(callback: () => void | Promise<void>): Promise<void>;
  create(element: ReactElement): Renderer;
}>("react-test-renderer");

it.each([
  { values: [], expected: [] },
  { values: [null, null], expected: [null, null] },
  { values: [0, null, 100], expected: [0, null, 1] },
  {
    values: [NaN, Infinity, -Infinity, -1],
    expected: [null, null, null, null],
  },
  { values: [Number.MIN_VALUE, Number.MIN_VALUE * 2], expected: [0.5, 1] },
  { values: [0, 0], expected: [0, 0] },
  { values: [100, 100], expected: [1, 1] },
  { values: [100, 101], expected: [100 / 101, 1] },
  { values: [1, 1e300, Infinity, -1], expected: [1e-300, 1, null, null] },
])("scales $values from a true zero baseline", ({ values, expected }) => {
  expect(barChartScale(values).fractions).toEqual(expected);
});

it("reveals the accessible actual week value on press", async () => {
  let renderer: Renderer | undefined;

  await act(async () => {
    renderer = create(
      <BarChart
        points={[
          {
            id: "week",
            label: "W1",
            value: 100,
            description: "Jan 5–11: 100 kg estimated 1RM",
          },
        ]}
        emptyMessage="No data"
      />,
    );
  });

  const button = renderer?.root.findAllByProps({
    accessibilityRole: "button",
  })[0];

  expect(button?.props.accessibilityLabel).toContain("100 kg");
  await act(async () => {
    const press = button?.props.onPress;

    if (typeof press === "function") press();
  });
  expect(
    renderer?.root.findAllByProps({ accessibilityRole: "button" })[0].props
      .accessibilityState,
  ).toEqual({ selected: true });
  await act(async () => {
    renderer?.unmount();
  });
});

it.each([
  { values: [] },
  { values: [null, null] },
  { values: [NaN, Infinity, -1] },
])(
  "renders an empty message for $values instead of invalid bars",
  async ({ values }) => {
    let renderer: Renderer | undefined;
    await act(async () => {
      renderer = create(
        <BarChart
          points={values.map((value, index) => ({
            id: String(index),
            label: `W${index + 1}`,
            value,
            description: "No usable value",
          }))}
          emptyMessage="No usable weeks"
        />,
      );
    });
    if (!renderer) throw new Error("Chart did not render");
    try {
      expect(
        renderer.root.findAllByProps({ children: "No usable weeks" }).length,
      ).toBeGreaterThan(0);
      expect(
        renderer.root.findAllByProps({ accessibilityRole: "button" }),
      ).toHaveLength(0);
    } finally {
      await act(async () => {
        renderer?.unmount();
      });
    }
  },
);

it("distinguishes missing and zero values when selecting bars and updates selected details", async () => {
  let renderer: Renderer | undefined;
  const points = [
    {
      id: "missing",
      label: "W1",
      value: null,
      description: "Jan 5–11: No data",
    },
    {
      id: "zero",
      label: "W2",
      value: 0,
      description: "Jan 12–18: 0 kg volume",
      partial: true,
    },
  ];
  await act(async () => {
    renderer = create(
      <BarChart points={points} emptyMessage="No usable weeks" />,
    );
  });
  if (!renderer) throw new Error("Chart did not render");
  const chart = renderer;
  try {
    expect(
      chart.root.findAllByProps({ children: "No usable weeks" }),
    ).toHaveLength(0);
    for (const point of points) {
      const target = chart.root.findAllByProps({
        accessibilityLabel: point.description,
      })[0];
      const handler = target?.props.onPress;
      if (typeof handler !== "function")
        throw new Error("Expected a selectable bar");
      await act(async () => {
        handler();
      });
      expect(
        chart.root.findAllByProps({ accessibilityLiveRegion: "polite" })[0]
          .props.children,
      ).toBe(point.description);
      expect(
        chart.root.findAllByProps({ accessibilityLabel: point.description })[0]
          .props.accessibilityState,
      ).toEqual({ selected: true });
    }
    expect(
      chart.root.findAllByProps({
        accessibilityLabel: points[0].description,
      })[0].props.accessibilityState,
    ).toEqual({ selected: false });
    await act(async () => {
      chart.update(
        <BarChart
          points={[
            points[0],
            {
              ...points[1],
              value: 500,
              description: "Jan 12–18: 500 kg volume",
            },
          ]}
          emptyMessage="No usable weeks"
        />,
      );
    });
    expect(
      chart.root.findAllByProps({ accessibilityLiveRegion: "polite" })[0].props
        .children,
    ).toBe("Jan 12–18: 500 kg volume");
    await act(async () => {
      chart.update(
        <BarChart points={[points[0]]} emptyMessage="No usable weeks" />,
      );
    });
    expect(
      chart.root.findAllByProps({ children: "No usable weeks" }).length,
    ).toBeGreaterThan(0);
    expect(
      chart.root.findAllByProps({ children: "Jan 12–18: 500 kg volume" }),
    ).toHaveLength(0);
  } finally {
    await act(async () => {
      chart.unmount();
    });
  }
});
