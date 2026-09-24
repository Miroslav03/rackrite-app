import { createElement, type ReactElement, type ReactNode } from "react";
import { FlatList, Text } from "react-native";

import type { TemplateListItem } from "@/domain/templates/list/templates.types";
import { TemplateSurfaceCard } from "@/shared/components/ui/TemplateSurfaceCard";

import { TemplateListCard } from "../components/TemplateListCard";
import { TemplatesScreenView } from "../TemplatesScreenView";

jest.mock("@/shared/components/layout/Screen", () => ({
  Screen: ({ children }: { children: ReactNode }) => children,
}));

type Node = {
  props: {
    children?: unknown;
    onPress?: () => void;
    onRefresh?: () => void;
    refreshing?: boolean;
    onEndReached?: () => void;
    accessibilityState?: { disabled: boolean };
    disabled?: boolean;
    data?: TemplateListItem[];
    footer?: ReactNode;
  };
};
type Renderer = {
  root: {
    findAllByType: (type: unknown) => Node[];
    findByType: (type: unknown) => Node;
    findByProps: (props: { testID: string }) => Node;
  };
  update: (element: ReactElement) => void;
  unmount: () => void;
};
const { act, create } = jest.requireActual<{
  act: (callback: () => void | Promise<void>) => Promise<void>;
  create: (element: ReactElement) => Renderer;
}>("react-test-renderer");

const renderers: Renderer[] = [];
async function render(element: ReactElement) {
  const result: { current?: Renderer } = {};
  await act(async () => {
    result.current = create(element);
  });
  if (!result.current) throw new Error("View not rendered");
  renderers.push(result.current);
  return result.current;
}
afterEach(async () => {
  await act(async () => {
    for (const renderer of renderers.splice(0)) renderer.unmount();
  });
});

const template: TemplateListItem = {
  id: "bench",
  name: "Bench Volume Day",
  description: "Chest hypertrophy and lock-out speed.",
  competitionLifts: [
    { id: "squat", name: "Competition Squat", liftFamily: "squat" },
    { id: "bench", name: "Competition Bench", liftFamily: "bench" },
  ],
  lastExecution: {
    finishedAt: new Date(2026, 8, 24, 0, 45).getTime(),
    durationMinutes: 75,
  },
};
const dateReference = new Date(2026, 8, 24).getTime();
const labels = (renderer: Renderer) =>
  renderer.root.findAllByType(Text).map(({ props }) => props.children);

it("renders competition labels and updates relative dates without making the card interactive", async () => {
  const renderer = await render(
    createElement(TemplateListCard, { template, dateReference }),
  );
  expect(labels(renderer)).toEqual(
    expect.arrayContaining([
      template.name,
      template.description,
      "Competition Squat",
      "Competition Bench",
      "Today",
      "75 min",
    ]),
  );
  expect(labels(renderer)).not.toContain("Competition Deadlift");
  expect(
    renderer.root.findByType(TemplateSurfaceCard).props.onPress,
  ).toBeUndefined();
  await act(async () =>
    renderer.update(
      createElement(TemplateListCard, {
        template,
        dateReference: new Date(2026, 8, 25).getTime(),
      }),
    ),
  );
  expect(labels(renderer)).toContain("Yesterday");
  expect(labels(renderer)).not.toContain("Today");
});

it("keeps a footer for a fresh template without inventing statistics or tags", async () => {
  const renderer = await render(
    createElement(TemplateListCard, {
      template: {
        ...template,
        description: null,
        competitionLifts: [],
        lastExecution: null,
      },
      dateReference,
    }),
  );
  expect(labels(renderer)).not.toEqual(
    expect.arrayContaining(["Today", "75 min", "Competition Bench"]),
  );
  expect(labels(renderer)).not.toContain("Never executed");
  expect(
    renderer.root.findByType(TemplateSurfaceCard).props.footer,
  ).toBeDefined();
});

it("shows an empty library with zero count and a disabled, unwired create button", async () => {
  const renderer = await render(
    createElement(TemplatesScreenView, {
      state: {
        status: "ready",
        items: [],
        refresh: { status: "idle" },
        revision: 1,
      },
      dateReference,
      onRefresh: jest.fn(),
    }),
  );
  expect(labels(renderer)).toEqual(
    expect.arrayContaining([
      "Library",
      "Templates",
      "0",
      "Saved Routines",
      "No templates yet",
      "Your saved workout templates will appear here.",
    ]),
  );
  const button = renderer.root.findByProps({
    testID: "create-template-button",
  });
  expect(button.props.disabled).toBe(true);
  expect(button.props.accessibilityState).toEqual({ disabled: true });
  expect(button.props.onPress).toBeUndefined();
  expect(labels(renderer)).not.toContain("Import from Coach");
});

it("keeps loaded cards visible on refresh error and connects the list refresh callback", async () => {
  const onRefresh = jest.fn();
  const renderer = await render(
    createElement(TemplatesScreenView, {
      state: {
        status: "ready",
        items: [template],
        refresh: { status: "error", error: new Error("Read failed") },
        revision: 1,
      },
      dateReference,
      onRefresh,
    }),
  );
  expect(labels(renderer)).toEqual(
    expect.arrayContaining([
      "1",
      template.name,
      "Couldn't refresh your templates. Your loaded templates are still available.",
    ]),
  );
  const list = renderer.root.findByType(FlatList);
  expect(list.props.data).toEqual([template]);
  expect(list.props.onEndReached).toBeUndefined();
  expect(list.props.refreshing).toBe(false);
  await act(async () => list.props.onRefresh?.());
  expect(onRefresh).toHaveBeenCalledTimes(1);
});
