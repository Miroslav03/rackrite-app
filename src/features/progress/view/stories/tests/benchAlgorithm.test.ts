import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import * as ts from "typescript";

import { analyzeCompetitionLifts } from "@/domain/progress/analysis/progress.useCases";
import { localCalendarDay } from "@/shared/utils/localCalendar";

import {
  benchAlgorithmScenarios,
  steadyBenchCheckpoints,
  steadyBenchHistory,
  steadyBenchWeeks,
} from "../benchAlgorithm.fixtures";
import {
  benchEstimateSources,
  describeBenchCheckpoint,
  formatBenchMeasurement,
  formatBenchSource,
} from "../benchAlgorithm.results";
import { progressStoryScenarios } from "../progressStory.scenarios";

const source = readFileSync(
  resolve(process.cwd(), "rackrite_bench_8_week_algorithm_test_scenarios.md"),
  "utf8",
);

it("keeps the fixture comment tables consistent with stored set data", () => {
  const fixture = readFileSync(
    resolve(__dirname, "../benchAlgorithm.fixtures.ts"),
    "utf8",
  );
  for (const scenario of benchAlgorithmScenarios) {
    const table = fixture
      .split(`// Scenario ${scenario.number} — `)[1]
      .split("export const")[0];
    const rows = table
      .split("\n")
      .filter((line) => /^\/\/ [1-8] \|/.test(line));
    const expected = scenario.sessions.flatMap((session) =>
      session.groups.map(
        (group) =>
          `// ${session.week} | ${session.label} | ${group.rpes.length} | ${group.reps} | ${group.weight} | ${group.rpes.map((rpe) => (rpe === null ? "—" : Math.floor(rpe))).join(", ")}`,
      ),
    );
    expect(rows).toEqual(expected);
  }
});

it("keeps all weekly report values and source traces consistent with actual checkpoints", () => {
  const report = readFileSync(
    resolve(process.cwd(), "docs/specs/progress/bench-algorithm-results.md"),
    "utf8",
  );
  for (const scenario of benchAlgorithmScenarios) {
    const section = report
      .split(`## Scenario ${scenario.number} — `)[1]
      .split("\n## ")[0];
    const rows = section
      .split("\n")
      .filter((line) => /^\| [1-8] \|/.test(line));
    const weekly = scenario.checkpoints.filter(
      (entry, index, list) =>
        index === list.length - 1 || list[index + 1].week !== entry.week,
    );
    expect(rows).toHaveLength(8);
    rows.forEach((row, index) => {
      const entry = weekly[index];
      const cells = row
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      expect(cells[3]).toBe(
        formatBenchMeasurement(
          entry.overview.lifts.bench.currentEstimatedMax,
          " kg",
        ),
      );
      expect(cells[5]).toBe(
        benchEstimateSources(entry)
          .map((set) => formatBenchSource(scenario, set))
          .join("<br>"),
      );
    });
    for (const entry of scenario.checkpoints) {
      const start = `| W${entry.week} D${entry.day} ${entry.label} |`;
      expect(
        section.split("\n").filter((line) => line.startsWith(start)),
      ).toHaveLength(4);
    }
  }
});

function checkpoint(scenario: number, week: number, day: number) {
  const result = benchAlgorithmScenarios[scenario - 1].checkpoints.find(
    (entry) => entry.week === week && entry.day === day,
  );
  if (!result)
    throw new Error(`Missing checkpoint: ${scenario}/${week}/${day}`);
  return result;
}

function estimate(scenario: number, week: number, day: number): number {
  const result = checkpoint(scenario, week, day).overview.lifts.bench
    .currentEstimatedMax;
  if (result.status !== "available")
    throw new Error("Expected available estimate");
  return result.value;
}

it.each(benchAlgorithmScenarios)(
  "preserves every source set in scenario $number, flooring only recorded RPE",
  (scenario) => {
    const section = source
      .split(`## Scenario ${scenario.number} — `)[1]
      .split("### Expected rolling output")[0];
    const rows = section
      .split("\n")
      .filter((line) => /^\| [1-8] \|/.test(line));
    expect(rows).toHaveLength(8);
    const expected = rows.flatMap((row) =>
      row
        .split("|")
        .slice(2, -1)
        .map((cell) =>
          Array.from(
            cell.matchAll(/`([\d.]+)×(\d+) @([\d.]+|—)`/g),
            ([, weight, reps, rpe]) => ({
              weight: Number(weight),
              reps: Number(reps),
              rpe: rpe === "—" ? null : Number(rpe),
            }),
          ),
        ),
    );
    const raw = scenario.sessions.map((session) =>
      session.groups.flatMap((group) =>
        group.rpes.map((rpe) => ({
          weight: group.weight,
          reps: group.reps,
          rpe,
        })),
      ),
    );
    expect(raw).toEqual(expected);
    expect(
      scenario.history.map((exposure) =>
        exposure.entries
          .flatMap((entry) => entry.sets)
          .map(({ weight, reps, rpe }) => ({ weight, reps, rpe })),
      ),
    ).toEqual(
      expected.map((sets) =>
        sets.map((set) => ({
          ...set,
          rpe: set.rpe === null ? null : Math.floor(set.rpe),
        })),
      ),
    );
  },
);

it("retains the original scenario 1 exports, data shape, source IDs and weekly estimates", () => {
  const scenario = benchAlgorithmScenarios[0];
  expect(steadyBenchHistory).toBe(scenario.history);
  expect(steadyBenchCheckpoints).toBe(scenario.checkpoints);
  expect(steadyBenchWeeks).toHaveLength(8);
  expect(steadyBenchWeeks[1]).toEqual({
    single: [105, 7.5],
    backoffWeight: 92.5,
    backoffRpes: [6.5, 7, 7.5, 7.5],
    volumeWeight: 85,
    volumeRpes: [6.5, 7, 7.5, 7.5],
  });
  const weekly = [
    (105 * 36) / 34,
    (105 * 36) / 33,
    (95 * 36) / 30,
    (107.5 * 36) / 33,
    (97.5 * 36) / 30,
    (110 * 36) / 33,
    (100 * 36) / 30,
    (112.5 * 36) / 33,
  ];
  for (let week = 1; week <= 8; week++) {
    expect(estimate(1, week, 2)).toBeCloseTo(weekly[week - 1], 8);
    for (const [day, kind] of [
      [1, "heavy"],
      [2, "volume"],
    ] as const) {
      const exposure = scenario.history[(week - 1) * 2 + day - 1];
      const id = `scenario_1_week_${week}_${kind}`;
      expect(exposure.workout.id).toBe(id);
      expect(exposure.entries[0].exercise.id).toBe(`${id}_entry`);
      exposure.entries[0].sets.forEach((set, index) => {
        expect(set.id).toBe(`${id}_entry_set_${index + 1}`);
      });
    }
  }
});

it("has 144 checkpoints with the intended weekly frequencies and session labels", () => {
  expect(
    benchAlgorithmScenarios.map((scenario) => scenario.checkpoints.length),
  ).toEqual([16, 16, 16, 16, 16, 24, 8, 16, 16]);
  expect(
    benchAlgorithmScenarios.flatMap((scenario) => scenario.checkpoints),
  ).toHaveLength(144);
  const threeDay = benchAlgorithmScenarios[5].checkpoints;
  expect(
    threeDay.slice(0, 3).map(({ week, day, label }) => ({ week, day, label })),
  ).toEqual([
    { week: 1, day: 1, label: "Heavy" },
    { week: 1, day: 2, label: "Volume" },
    { week: 1, day: 3, label: "Technique" },
  ]);
  expect(
    benchAlgorithmScenarios[6].checkpoints.map(({ week, day }) => [week, day]),
  ).toEqual(Array.from({ length: 8 }, (_, index) => [index + 1, 1]));
  expect(checkpoint(5, 5, 1).label).toBe("Deload heavy");
  expect(checkpoint(5, 5, 2).label).toBe("Deload volume");
  expect(checkpoint(5, 5, 1).history.at(-1)?.entries[0].sets).toHaveLength(4);
  expect(checkpoint(5, 5, 2).history.at(-1)?.entries[0].sets).toHaveLength(3);
});

it.each(benchAlgorithmScenarios)(
  "uses completed chronological prefixes and actual analysis for scenario $number",
  (scenario) => {
    const firstDay = localCalendarDay(new Date(2026, 0, 5, 18).getTime());
    scenario.checkpoints.forEach((entry, index) => {
      expect(entry.history).toEqual(scenario.history.slice(0, index + 1));
      const session = scenario.sessions[index];
      const offset = { heavy: 0, volume: 3, technique: 5 }[session.kind];
      const time = entry.overview.analysisTime;
      expect(localCalendarDay(time)).toBe(
        firstDay + (entry.week - 1) * 7 + offset,
      );
      expect(new Date(time).getHours()).toBe(18);
      expect(entry.overview).toEqual(
        analyzeCompetitionLifts(entry.history, time),
      );
      expect(entry.overview.lifts.squat.status.reason).toBe("no_history");
      expect(entry.overview.lifts.deadlift.status.reason).toBe("no_history");
      entry.history.forEach((exposure) => {
        expect(exposure.workout.status).toBe("completed");
        expect(exposure.workout.finishedAt).toBeLessThanOrEqual(time);
        exposure.entries.forEach((exercise) =>
          exercise.sets.forEach((set) => {
            expect(set.finishedAt).toBeGreaterThanOrEqual(
              exposure.workout.startedAt,
            );
            expect(set.finishedAt).toBeLessThanOrEqual(
              exposure.workout.finishedAt ?? 0,
            );
          }),
        );
      });
      expect(
        entry.overview.lifts.bench.sessions.every(
          (session) => session.issues.length === 0,
        ),
      ).toBe(true);
    });
  },
);

it("uses globally unique workout, entry and set IDs", () => {
  const history = benchAlgorithmScenarios.flatMap(
    (scenario) => scenario.history,
  );
  const ids = history.flatMap((exposure) => [
    exposure.workout.id,
    ...exposure.entries.flatMap((entry) => [
      entry.exercise.id,
      ...entry.sets.map((set) => set.id),
    ]),
  ]);
  expect(new Set(ids).size).toBe(ids.length);
});

it.each([
  [2, 1, 2, 110, 35], // 110×1 @9
  [2, 8, 2, 110, 33], // 110×1 @7
  [3, 8, 2, 110, 34], // Stable single; adjusted backoffs fail the representative floor.
  [4, 1, 2, 100, 30], // Flooring makes a backoff stronger than the single.
  [4, 8, 2, 107.5, 35],
  [5, 5, 2, 97.5, 30], // Low-RPE deload days do not expire eligible performance days.
  [5, 8, 2, 115, 34],
  [6, 1, 3, 105, 34],
  [6, 8, 3, 112.5, 33],
  [7, 5, 1, 102.5, 33], // Week 3's estimate still survives the latest three days.
  [7, 8, 1, 107.5, 33],
  [8, 4, 2, 107.5, 36],
  [8, 8, 2, 112.5, 36],
  [9, 8, 1, 110, 34], // Week 7's heavy day still survives.
  [9, 8, 2, 95, 30], // Week 7's heavy day expires; the RPE 6 single is excluded.
])(
  "calculates scenario %i week %i day %i from the expected qualifying set",
  (scenario, week, day, weight, denominator) => {
    expect(estimate(scenario, week, day)).toBeCloseTo(
      (weight * 36) / denominator,
      8,
    );
  },
);

it("retains missing RPE and keeps low-RPE training in workload without strength eligibility", () => {
  const missing = checkpoint(8, 4, 2).overview.lifts.bench;
  expect(missing.currentEstimatedMaxBasis).toBe("load_reps");
  expect(missing.sessions.at(-1)?.rpeSetCount).toBe(0);
  expect(
    missing.sessions.at(-1)?.strengthSets.every((set) => set.rpe === null),
  ).toBe(true);
  const deload = checkpoint(5, 5, 2).overview.lifts.bench.sessions.slice(-2);
  expect(deload.map((session) => session.volume)).toEqual([1055, 1305]);
  expect(deload.every((session) => session.rawRepresentative === null)).toBe(
    true,
  );
  expect(deload.every((session) => session.strengthSets.length === 0)).toBe(
    true,
  );
});

it("records observed status gaps without overriding them to match scenario intent", () => {
  const easier = checkpoint(2, 8, 2).overview.lifts.bench;
  expect(easier.status.value).toBe("plateaued");
  expect(easier.trends.performance.change).toEqual({
    status: "available",
    value: 0,
  });
  const regression = checkpoint(4, 8, 2).overview.lifts.bench;
  expect(checkpoint(4, 7, 2).overview.lifts.bench.status.value).toBe(
    "regressing",
  );
  expect(regression.status).toMatchObject({
    value: "stable",
    reason: "confirming_change",
  });
  expect(checkpoint(4, 8, 1).overview.lifts.bench.trends.basis).toBe(
    "effort_adjusted",
  );
  expect(regression.trends.basis).toBe("matched_reps_rpe");
});

it("traces actual max sources, including a winner from an earlier week", () => {
  for (const scenario of benchAlgorithmScenarios) {
    for (const entry of scenario.checkpoints) {
      const sources = benchEstimateSources(entry);
      expect(sources.length).toBeGreaterThan(0);
      for (const source of sources) {
        expect(
          entry.history.some((exposure) =>
            exposure.entries.some((exercise) =>
              exercise.sets.some((set) => set.id === source.setId),
            ),
          ),
        ).toBe(true);
        expect(formatBenchSource(scenario, source)).toMatch(/^W\d D[123] /);
      }
    }
  }
  expect(benchEstimateSources(checkpoint(7, 5, 1))[0].workoutId).toBe(
    "scenario_7_week_3_heavy",
  );
  expect(benchEstimateSources(checkpoint(9, 8, 2))[0].reps).toBe(4);
});

it("keeps Notes readable with missing RPE, actual results and the correct three-day labels", () => {
  const missing = describeBenchCheckpoint(
    benchAlgorithmScenarios[7],
    checkpoint(8, 4, 2),
  );
  expect(missing).toContain("87.5×6 @—");
  expect(missing).toContain("Estimated max: 107.5 kg (load_reps)");
  expect(missing).not.toContain("@null");
  expect(missing).toContain("Benchmark: unavailable (");
  const threeDay = describeBenchCheckpoint(
    benchAlgorithmScenarios[5],
    checkpoint(6, 2, 1),
  );
  expect(threeDay).toContain("Week 1 · Day 3 · Technique");
  expect(threeDay).toContain("Week 2 · Day 1 · Heavy");
  expect(threeDay).not.toContain("Week 2 · Day 2");
});

it("registers every checkpoint exactly once as a named Storybook export in its scenario group", () => {
  const ids: string[] = [];
  const directory = resolve(__dirname, "..");
  const files = readdirSync(directory).filter((name) =>
    /^BenchAlgorithm(?:Scenario\d+)?\.stories\.tsx$/.test(name),
  );
  expect(files).toHaveLength(9);
  for (const file of files) {
    const content = readFileSync(resolve(directory, file), "utf8");
    const module = ts.createSourceFile(
      file,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const storyIds: string[] = [];
    for (const statement of module.statements) {
      if (
        !ts.isVariableStatement(statement) ||
        !statement.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        )
      )
        continue;
      for (const declaration of statement.declarationList.declarations) {
        const call = declaration.initializer;
        if (
          !call ||
          !ts.isCallExpression(call) ||
          call.expression.getText(module) !== "createProgressStory"
        )
          continue;
        const arg = call.arguments[0];
        if (!ts.isStringLiteral(arg))
          throw new Error("Story ID must be a static string");
        expect(declaration.name.getText(module)).toMatch(
          /^Week[1-8](Heavy|Volume|Technique)$/,
        );
        storyIds.push(arg.text);
      }
    }
    const scenarioNumber = Number(file.match(/Scenario(\d+)/)?.[1] ?? 1);
    expect(content).toContain(
      `title: "Progress/Algorithm scenarios/Bench/Scenario ${scenarioNumber}"`,
    );
    expect(content).toContain(
      `id: "progress-algorithm-scenarios-scenario-${scenarioNumber}"`,
    );
    expect(storyIds).toEqual(
      benchAlgorithmScenarios[scenarioNumber - 1].checkpoints.map(
        (entry) =>
          `bench-scenario-${scenarioNumber}-week-${entry.week}-day-${entry.day}`,
      ),
    );
    ids.push(...storyIds);
  }
  const catalog = progressStoryScenarios.filter((scenario) =>
    scenario.id.startsWith("bench-scenario-"),
  );
  expect(ids).toHaveLength(144);
  expect(new Set(ids).size).toBe(144);
  expect([...ids].sort()).toEqual(
    catalog.map((scenario) => scenario.id).sort(),
  );
  for (const scenario of benchAlgorithmScenarios) {
    for (const entry of scenario.checkpoints) {
      const registered = catalog.find(
        (item) =>
          item.id ===
          `bench-scenario-${scenario.number}-week-${entry.week}-day-${entry.day}`,
      );
      expect(registered?.overview).toBe(entry.overview);
      expect(registered?.group).toBe(
        `Algorithm scenarios/Bench/Scenario ${scenario.number}`,
      );
      expect(registered?.description).toContain(
        "Recorded input through this checkpoint:",
      );
    }
  }
});
