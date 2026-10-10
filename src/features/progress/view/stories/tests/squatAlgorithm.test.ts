import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import * as ts from "typescript";

import { analyzeCompetitionLifts } from "@/domain/progress/analysis/progress.useCases";
import { createProgressViewModel } from "../../progress.viewModel";
import {
  algorithmEstimateSources,
  describeAlgorithmCheckpoint,
  formatAlgorithmBenchmark,
  formatAlgorithmMeasurement,
  formatAlgorithmSource,
} from "../algorithmScenario.results";
import { benchAlgorithmScenarios } from "../benchAlgorithm.fixtures";
import { progressStoryScenarios } from "../progressStory.scenarios";
import {
  steadySquatCheckpoints,
  steadySquatHistory,
  steadySquatScenario,
  steadySquatWeeks,
} from "../squatAlgorithm.fixtures";

const weeklyLoads = [
  [225, 200, 190],
  [225, 200, 190],
  [227.5, 202.5, 192.5],
  [227.5, 202.5, 192.5],
  [230, 205, 195],
  [230, 205, 195],
  [232.5, 207.5, 197.5],
  [232.5, 207.5, 197.5],
];

it("records the exact eight-week training block, flooring RPE without rounding weights", () => {
  expect(steadySquatScenario.liftFamily).toBe("squat");
  expect(steadySquatWeeks).toEqual(
    weeklyLoads.map(([single, backoff, volume]) => [
      {
        kind: "heavy",
        label: "Heavy",
        groups: [
          { weight: single, reps: 1, rpes: [8] },
          { weight: backoff, reps: 4, rpes: [7, 7.5, 8] },
        ],
      },
      {
        kind: "volume",
        label: "Volume",
        groups: [{ weight: volume, reps: 5, rpes: [7, 7.5, 8, 8] }],
      },
    ]),
  );
  expect(steadySquatHistory).toBe(steadySquatScenario.history);
  expect(steadySquatCheckpoints).toBe(steadySquatScenario.checkpoints);
  expect(steadySquatHistory).toHaveLength(16);
  steadySquatHistory.forEach((exposure, index) => {
    const [single, backoff, volume] = weeklyLoads[Math.floor(index / 2)];
    const sets = exposure.entries.flatMap((entry) => entry.sets);
    expect(
      sets.map(({ weight, reps, rpe }) => ({ weight, reps, rpe })),
    ).toEqual(
      index % 2 === 0
        ? [
            { weight: single, reps: 1, rpe: 8 },
            { weight: backoff, reps: 4, rpe: 7 },
            { weight: backoff, reps: 4, rpe: 7 },
            { weight: backoff, reps: 4, rpe: 8 },
          ]
        : [
            { weight: volume, reps: 5, rpe: 7 },
            { weight: volume, reps: 5, rpe: 7 },
            { weight: volume, reps: 5, rpe: 8 },
            { weight: volume, reps: 5, rpe: 8 },
          ],
    );
    expect(sets.every((set) => set.type === "working")).toBe(true);
    if (index % 2 === 0) expect(sets[0].weight).toBeGreaterThan(220);
  });
});

it("keeps the fixture comment table accurate for all grouped stored sets", () => {
  const source = readFileSync(
    resolve(__dirname, "../squatAlgorithm.fixtures.ts"),
    "utf8",
  );
  const rows = source.split("\n").filter((line) => /^\/\/ [1-8] \|/.test(line));
  expect(rows).toEqual(
    steadySquatScenario.sessions.flatMap((session) =>
      session.groups.map(
        (group) =>
          `// ${session.week} | ${session.label} | ${group.rpes.length} | ${group.reps} | ${group.weight} | ${group.rpes.map((rpe) => (rpe === null ? "—" : Math.floor(rpe))).join(", ")}`,
      ),
    ),
  );
  expect(rows).toHaveLength(24);
});

it("uses Monday and Thursday at 18:00 with valid completed-set ownership and ordering", () => {
  steadySquatHistory.forEach((exposure, index) => {
    const weekIndex = Math.floor(index / 2);
    const heavy = index % 2 === 0;
    const finishedAt = new Date(
      2026,
      0,
      5 + weekIndex * 7 + (heavy ? 0 : 3),
      18,
    ).getTime();
    const workoutId = `squat_scenario_1_week_${weekIndex + 1}_${heavy ? "heavy" : "volume"}`;
    expect(exposure.workout).toEqual({
      id: workoutId,
      status: "completed",
      startedAt: finishedAt - 3600000,
      finishedAt,
    });
    expect(exposure.exercise).toEqual({
      id: "competition_squat",
      kind: "competition_lift",
      origin: "built_in",
      liftFamily: "squat",
    });
    const entry = exposure.entries[0];
    expect(entry.exercise).toEqual({
      id: `${workoutId}_entry`,
      workoutId,
      exerciseId: "competition_squat",
      orderIndex: 0,
    });
    entry.sets.forEach((set, setIndex) => {
      expect(set.id).toBe(`${entry.exercise.id}_set_${setIndex + 1}`);
      expect(set.workoutExerciseId).toBe(entry.exercise.id);
      expect(set.setIndex).toBe(setIndex);
      expect(set.finishedAt).toBe(
        finishedAt - (entry.sets.length - setIndex) * 60000,
      );
    });
  });
});

it("analyzes each chronological history prefix for Squat and leaves other lifts empty", () => {
  expect(steadySquatCheckpoints).toHaveLength(16);
  steadySquatCheckpoints.forEach((checkpoint, index) => {
    expect(checkpoint.history).toEqual(steadySquatHistory.slice(0, index + 1));
    expect([checkpoint.week, checkpoint.day, checkpoint.label]).toEqual([
      Math.floor(index / 2) + 1,
      (index % 2) + 1,
      index % 2 === 0 ? "Heavy" : "Volume",
    ]);
    const time = steadySquatHistory[index].workout.finishedAt;
    expect(time).not.toBeNull();
    if (time === null) throw new Error("Expected a completed session");
    expect(checkpoint.overview).toEqual(
      analyzeCompetitionLifts(checkpoint.history, time),
    );
    expect(checkpoint.overview.lifts.squat.sessions).toHaveLength(index + 1);
    for (const family of ["bench", "deadlift"] as const) {
      expect(checkpoint.overview.lifts[family].sessions).toHaveLength(0);
      expect(checkpoint.overview.lifts[family].status.reason).toBe(
        "no_history",
      );
    }
    expect(
      checkpoint.history.every(
        (exposure) =>
          exposure.workout.finishedAt !== null &&
          exposure.workout.finishedAt <= time,
      ),
    ).toBe(true);
  });
});

it("keeps workout, entry, and set IDs unique across both lift packs", () => {
  const history = [
    ...benchAlgorithmScenarios.flatMap((scenario) => scenario.history),
    ...steadySquatHistory,
  ];
  const ids = history.flatMap((exposure) => [
    exposure.workout.id,
    ...exposure.entries.flatMap((entry) => [
      entry.exercise.id,
      ...entry.sets.map((set) => set.id),
    ]),
  ]);
  expect(new Set(ids).size).toBe(ids.length);
});

it.each(
  weeklyLoads.map((loads, index) => ({ week: index + 1, backoff: loads[1] })),
)(
  "independently calculates week $week from its qualified four-rep backoff",
  ({ week, backoff }) => {
    // Brzycki at four reps and stored RPE 7: three additional effective reps.
    const expected = (backoff * 36) / (37 - 4 - 3);
    for (const checkpoint of steadySquatCheckpoints.filter(
      (entry) => entry.week === week,
    )) {
      expect(checkpoint.overview.lifts.squat.currentEstimatedMax).toEqual({
        status: "available",
        value: expected,
      });
      expect(checkpoint.overview.lifts.squat.currentEstimatedMaxBasis).toBe(
        "effort_adjusted",
      );
      const sources = algorithmEstimateSources(checkpoint, "squat");
      expect(sources.length).toBeGreaterThan(0);
      expect(
        sources.every(
          (set) => set.weight === backoff && set.reps === 4 && set.rpe === 7,
        ),
      ).toBe(true);
    }
  },
);

it("preserves actual early classifications and confirms progress only at the final checkpoint", () => {
  expect(
    steadySquatCheckpoints.map(
      (entry) => entry.overview.lifts.squat.status.value,
    ),
  ).toEqual([
    ...Array<string>(8).fill("learning"),
    ...Array<string>(7).fill("stable"),
    "progressing",
  ]);
  expect(steadySquatCheckpoints[10].overview.lifts.squat.trends.basis).toBe(
    "effort_adjusted",
  );
  expect(steadySquatCheckpoints[11].overview.lifts.squat.trends.basis).toBe(
    "matched_reps_rpe",
  );
  const final = steadySquatCheckpoints[15].overview.lifts.squat;
  expect(final.status).toEqual({
    value: "progressing",
    reason: "confirmed_trend",
    confirmed: true,
  });
  expect(final.evidence).toEqual({
    level: "strong",
    supportingDays: 5,
    consideredDays: 5,
    reasons: ["consistent_pattern"],
  });
  expect(final.trends.basis).toBe("matched_reps_rpe");
  expect(final.trends.performance.change.status).toBe("available");
  if (final.trends.performance.change.status !== "available")
    throw new Error("Expected a strength comparison");
  expect(final.trends.performance.change.value).toBeCloseTo(
    (207.5 / 202.5 - 1) * 100,
    10,
  );
  expect(final.diagnosis.kind).toBe("none");
  expect(final.recommendation.kind).toBe("continue_approach");
  expect(final.recommendation.benchmark).toMatchObject({
    weight: 200,
    reps: 5,
    rpe: { min: 7, max: 8 },
    intent: "progress",
    loadChange: 2.5,
  });
});

it("retains early unavailable reasons and complete-week workload behavior", () => {
  expect(
    steadySquatCheckpoints[0].overview.lifts.squat.trends.effort.change,
  ).toEqual({ status: "unavailable", reason: "partial_rpe" });
  expect(
    steadySquatCheckpoints[13].overview.lifts.squat.trends.volumeChange,
  ).toEqual({ status: "unavailable", reason: "incomplete_period" });
  const final = steadySquatCheckpoints[15].overview.lifts.squat;
  expect(final.trends.effort.change).toEqual({ status: "available", value: 0 });
  expect(final.trends.hardSetsChange).toEqual({
    status: "available",
    value: 0,
  });
  expect(final.trends.frequencyChange).toEqual({
    status: "available",
    value: 0,
  });
  expect(final.trends.volumeChange.status).toBe("available");
});

it("traces retained winning sets from the selected lift and previous heavy sessions", () => {
  const heavy = steadySquatCheckpoints[14];
  expect(
    algorithmEstimateSources(heavy, "squat").map((set) =>
      formatAlgorithmSource(steadySquatScenario, set),
    ),
  ).toEqual(["W7 D1 Heavy: 207.5×4 @7", "W8 D1 Heavy: 207.5×4 @7"]);
  expect(
    algorithmEstimateSources(steadySquatCheckpoints[15], "squat").map((set) =>
      formatAlgorithmSource(steadySquatScenario, set),
    ),
  ).toEqual(["W8 D1 Heavy: 207.5×4 @7"]);
  expect(algorithmEstimateSources(heavy, "bench")).toEqual([]);
});

it("includes the Squat intent, completed inputs, actual results, and correct empty lifts in Notes", () => {
  const early = describeAlgorithmCheckpoint(
    steadySquatScenario,
    steadySquatCheckpoints[0],
  );
  expect(early).toContain("competition squat only");
  expect(early).toContain("Bench/deadlift have no history");
  expect(early).toContain(
    "Week 1 · Day 1 · Heavy: 225×1 @8; 200×4 @7; 200×4 @7; 200×4 @8",
  );
  expect(early).not.toContain("Week 1 · Day 2");
  expect(early).not.toContain("Week 2 ·");
  const final = describeAlgorithmCheckpoint(
    steadySquatScenario,
    steadySquatCheckpoints[15],
  );
  expect(final).toContain("only these 16 completed sessions");
  expect(final).toContain("Estimated max: 249.0 kg (effort_adjusted)");
  expect(final).toContain(
    "Status: progressing (confirmed_trend, confirmed: true)",
  );
  expect(final).toContain("Strength: 2.5% (matched_reps_rpe)");
  expect(final).toContain("Benchmark: progress: 200×5 @7–8");
  expect(final).toContain("Week 8 · Day 2 · Volume: 197.5×5 @7");
});

it("registers every Squat checkpoint once and has exactly 160 named algorithm stories", () => {
  const directory = resolve(__dirname, "..");
  const files = readdirSync(directory).filter((name) =>
    /^(BenchAlgorithm(?:Scenario\d+)?|SquatAlgorithm)\.stories\.tsx$/.test(
      name,
    ),
  );
  expect(files).toHaveLength(10);
  const ids: string[] = [];
  for (const file of files) {
    const content = readFileSync(resolve(directory, file), "utf8");
    const module = ts.createSourceFile(
      file,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
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
        const id = call.arguments[0];
        if (!ts.isStringLiteral(id))
          throw new Error("Expected a static scenario ID");
        expect(declaration.name.getText(module)).toMatch(
          /^Week[1-8](Heavy|Volume|Technique)$/,
        );
        ids.push(id.text);
      }
    }
    if (file === "SquatAlgorithm.stories.tsx") {
      expect(content).toContain(
        'title: "Progress/Algorithm scenarios/Squat/Scenario 1"',
      );
      expect(content).toContain(
        'args: { ...progressStoryMeta.args, initialLift: "squat" }',
      );
    }
  }
  const catalog = progressStoryScenarios.filter((scenario) =>
    /^(bench|squat)-scenario-/.test(scenario.id),
  );
  expect(ids).toHaveLength(160);
  expect(new Set(ids).size).toBe(160);
  expect([...ids].sort()).toEqual(
    catalog.map((scenario) => scenario.id).sort(),
  );
  expect(ids.filter((id) => id.startsWith("squat-scenario-"))).toEqual(
    steadySquatCheckpoints.map(
      (entry) => `squat-scenario-1-week-${entry.week}-day-${entry.day}`,
    ),
  );
  for (const checkpoint of steadySquatCheckpoints) {
    const registered = catalog.find(
      (entry) =>
        entry.id ===
        `squat-scenario-1-week-${checkpoint.week}-day-${checkpoint.day}`,
    );
    expect(registered?.group).toBe("Algorithm scenarios/Squat/Scenario 1");
    expect(registered?.overview).toBe(checkpoint.overview);
    expect(registered?.description).toBe(
      describeAlgorithmCheckpoint(steadySquatScenario, checkpoint),
    );
  }
});

it("keeps the report inputs, independent weekly values, and all per-session results accurate", () => {
  const report = readFileSync(
    resolve(process.cwd(), "docs/specs/progress/squat-algorithm-results.md"),
    "utf8",
  );
  const inputRows = report
    .split("## Recorded inputs")[1]
    .split("## Analysis rules")[0]
    .split("\n")
    .filter((line) => /^\| [1-8] \|/.test(line));
  expect(inputRows).toEqual(
    steadySquatScenario.sessions.flatMap((session) =>
      session.groups.map(
        (group) =>
          `| ${session.week} | ${session.label} | ${group.rpes.length} | ${group.reps} | ${group.weight} | ${group.rpes.join(", ")} | ${group.rpes.map((rpe) => (rpe === null ? "—" : Math.floor(rpe))).join(", ")} |`,
      ),
    ),
  );
  const weeklyRows = report
    .split("## Weekly independently calculated estimated max")[1]
    .split("## Lift Status")[0]
    .split("\n")
    .filter((line) => /^\| [1-8] \|/.test(line));
  expect(weeklyRows).toEqual(
    steadySquatCheckpoints
      .filter((entry) => entry.day === 2)
      .map((entry) => {
        const analysis = entry.overview.lifts.squat;
        const expected = (weeklyLoads[entry.week - 1][1] * 36) / 30;
        const sources = algorithmEstimateSources(entry, "squat")
          .map((set) => formatAlgorithmSource(steadySquatScenario, set))
          .join("<br>");
        return `| ${entry.week} | ${expected.toFixed(1)} kg | ${formatAlgorithmMeasurement(analysis.currentEstimatedMax, " kg")} | ${sources} | ${analysis.status.value} |`;
      }),
  );
  for (const entry of steadySquatCheckpoints) {
    const start = `| W${entry.week} D${entry.day} ${entry.label} |`;
    const rows = report.split("\n").filter((line) => line.startsWith(start));
    const analysis = entry.overview.lifts.squat;
    expect(rows).toHaveLength(4);
    expect(rows[0]).toContain(
      `${formatAlgorithmMeasurement(analysis.currentEstimatedMax, " kg")} | ${analysis.currentEstimatedMaxBasis} | ${analysis.status.value} | ${analysis.status.reason} / ${analysis.status.confirmed}`,
    );
    expect(
      rows[0].endsWith(
        `| ${createProgressViewModel(entry.overview, "squat").status.estimateChange ?? "—"} |`,
      ),
    ).toBe(true);
    expect(rows[1]).toContain(
      `${formatAlgorithmMeasurement(analysis.trends.performance.change, "%")} / ${analysis.trends.basis}`,
    );
    expect(rows[2]).toContain(formatAlgorithmBenchmark(analysis));
    expect(rows[3]).toContain(
      algorithmEstimateSources(entry, "squat")
        .map((set) => formatAlgorithmSource(steadySquatScenario, set))
        .join("<br>"),
    );
  }
});
