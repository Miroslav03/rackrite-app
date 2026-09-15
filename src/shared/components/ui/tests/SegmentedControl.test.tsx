import { type ReactElement } from "react";

import { SegmentedControl } from "../SegmentedControl";

type Node = {
  props: Record<string, unknown>;
  findAllByProps(props: Record<string, unknown>): Node[];
};

type Renderer = { root: Node; unmount(): void };

const { act, create } = jest.requireActual<{
  act(callback: () => void | Promise<void>): Promise<void>;
  create(element: ReactElement): Renderer;
}>("react-test-renderer");

it("announces selection and status and delegates controlled selection", async () => {
  const onChange = jest.fn();
  let renderer: Renderer | undefined;

  await act(async () => {
    renderer = create(
      <SegmentedControl
        value="bench"
        onChange={onChange}
        accessibilityLabel="Competition lift"
        options={[
          {
            value: "squat",
            label: "Squat",
            accessibilityLabel: "Squat, Progressing",
          },
          { value: "bench", label: "Bench" },
        ]}
      />,
    );
  });

  const tabs = renderer?.root.findAllByProps({ accessibilityRole: "tab" });

  expect(tabs?.[0].props.accessibilityLabel).toBe("Squat, Progressing");
  expect(
    renderer?.root.findAllByProps({ accessibilityLabel: "Bench" })[0].props
      .accessibilityState,
  ).toMatchObject({ selected: true });
  await act(async () => {
    const press = tabs?.[0].props.onPress;

    if (typeof press === "function") press();
  });
  expect(onChange).toHaveBeenCalledWith("squat");
  await act(async () => {
    renderer?.unmount();
  });
});
