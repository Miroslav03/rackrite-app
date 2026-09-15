import type { ReactElement } from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import type {
  LiftAnalysis,
  ProgressOverview,
} from "@/domain/progress/analysis/progress.analysis.types";
import { analyzeCompetitionLifts } from "@/domain/progress/analysis/progress.useCases";
import type { BenchmarkTarget } from "@/domain/progress/benchmark/progress.benchmark.types";
import { atDay, series } from "@/domain/progress/tests/progress.test.helpers";
import type { LiftTrendMetrics } from "@/domain/progress/trends/progress.trends.types";

import { createProgressViewModel } from "../progress.viewModel";

export type TestNode = {
  props: Record<string, unknown> & {
    children?: unknown;
    style?: StyleProp<ViewStyle & TextStyle>;
    onPress?: () => void;
  };
  findAllByType(type: unknown): TestNode[];
  findAll(
    predicate: (node: TestNode) => boolean,
    options?: { deep: boolean },
  ): TestNode[];
  findAllByProps(props: Record<string, unknown>): TestNode[];
};

export type TestRenderer = {
  root: TestNode;
  update(element: ReactElement): void;
  unmount(): void;
};

export const { act, create } = jest.requireActual<{
  act(callback: () => void | Promise<void>): Promise<void>;
  create(element: ReactElement): TestRenderer;
}>("react-test-renderer");

// Fixed local dates avoid dependence on today's date or UTC/local-day boundaries.
export const baseOverview = analyzeCompetitionLifts(
  series(Array(16).fill(100)),
  atDay(60),
);
export const baseAnalysis = baseOverview.lifts.bench;

export function overviewWith(
  analysis: Partial<LiftAnalysis> = {},
  trends: Partial<LiftTrendMetrics> = {},
): ProgressOverview {
  return {
    ...baseOverview,
    lifts: {
      ...baseOverview.lifts,
      bench: {
        ...baseAnalysis,
        ...analysis,
        trends: { ...baseAnalysis.trends, ...analysis.trends, ...trends },
      },
    },
  };
}

export function cardModel(
  analysis: Partial<LiftAnalysis> = {},
  trends: Partial<LiftTrendMetrics> = {},
) {
  return createProgressViewModel(
    overviewWith(analysis, trends),
    "bench",
    "performance",
  );
}

export function benchmark(
  overrides: Partial<BenchmarkTarget> = {},
): BenchmarkTarget {
  return {
    intent: "progress",
    weight: 102.5,
    reps: 3,
    rpe: { min: 7, max: 8 },
    sources: [],
    reason: "supported_progression",
    ...overrides,
  };
}

export async function renderCard(element: ReactElement): Promise<TestRenderer> {
  let renderer: TestRenderer | undefined;
  await act(async () => {
    renderer = create(element);
  });
  if (!renderer) throw new Error("Component did not render");
  return renderer;
}

export async function dispose(renderer: TestRenderer) {
  await act(async () => {
    renderer.unmount();
  });
}

function textContent(value: unknown): string {
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (Array.isArray(value)) return value.map(textContent).join("");
  return "";
}

export function visibleText(root: TestNode): string[] {
  return root
    .findAllByType(Text)
    .map((node) => textContent(node.props.children));
}

export function viewStyles(root: TestNode) {
  return root
    .findAllByType(View)
    .map((node) => StyleSheet.flatten(node.props.style) ?? {});
}

export function textStyles(root: TestNode, text: string) {
  return root
    .findAllByType(Text)
    .filter((node) => textContent(node.props.children) === text)
    .map((node) => StyleSheet.flatten(node.props.style) ?? {});
}

export function buttons(root: TestNode): TestNode[] {
  // NativeWind wraps Pressable; query its public interaction props instead of its component identity.
  return root.findAll(
    (node) =>
      node.props.accessibilityRole === "button" &&
      typeof node.props.onPress === "function",
    { deep: false },
  );
}

export function button(root: TestNode, label: string): TestNode {
  const matches = buttons(root).filter(
    (node) => node.props.accessibilityLabel === label,
  );
  expect(matches).toHaveLength(1);
  return matches[0];
}

export async function press(node: TestNode) {
  const onPress = node.props.onPress;
  if (!onPress) throw new Error("Expected an enabled press handler");
  await act(async () => {
    onPress();
  });
}
