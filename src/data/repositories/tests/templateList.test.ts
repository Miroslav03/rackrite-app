import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { DatabaseSync, SQLInputValue } from "node:sqlite";

import { db } from "@/data/db/client";
import { exercisesTable, workoutsTable } from "@/data/db/schema";
import { exerciseToRow } from "@/data/mappers/exerciseMappers";
import {
  barbellRow,
  competitionBench,
  competitionDeadlift,
  competitionSquat,
  pausedBench,
} from "@/domain/templates/editor/tests/templates.test.constants";
import { createTemplate } from "@/domain/templates/editor/tests/templates.test.helpers";

import {
  getTemplateList,
  insertTemplateAggregate,
} from "../templateRepository";

// Exercise the real Expo Drizzle driver with an isolated native-client substitute.
jest.mock("expo-sqlite", () => {
  const { DatabaseSync } =
    jest.requireActual<typeof import("node:sqlite")>("node:sqlite");
  const testDatabase = new DatabaseSync(":memory:");
  const queries: string[] = [];

  return {
    testDatabase,
    queries,
    openDatabaseSync: () => ({
      execSync: (sql: string) => testDatabase.exec(sql),
      prepareSync: (sql: string) => {
        queries.push(sql);
        const statement = testDatabase.prepare(sql);
        return {
          executeSync: (params: SQLInputValue[]) => statement.run(...params),
          executeForRawResultSync: (params: SQLInputValue[]) => {
            statement.setReturnArrays(true);
            return { getAllSync: () => statement.all(...params) };
          },
        };
      },
    }),
  };
});

const { testDatabase, queries } = jest.requireMock<{
  testDatabase: DatabaseSync;
  queries: string[];
}>("expo-sqlite");

beforeAll(() => {
  testDatabase.exec(
    readFileSync(
      resolve(__dirname, "../../db/migrations/0000_init.sql"),
      "utf8",
    ),
  );
});

beforeEach(() => {
  testDatabase.exec(
    "DELETE FROM templates; DELETE FROM workouts; DELETE FROM exercises;",
  );
  db.insert(exercisesTable)
    .values(
      [
        competitionBench,
        competitionSquat,
        competitionDeadlift,
        pausedBench,
        barbellRow,
      ].map(exerciseToRow),
    )
    .run();
  queries.length = 0;
});

afterAll(() => testDatabase.close());

it("returns an empty list when no templates have been saved", async () => {
  await expect(getTemplateList()).resolves.toEqual([]);
});

it("lists only competition lifts in exercise order and preserves optional metadata", async () => {
  await insertTemplateAggregate(
    createTemplate("three", [
      competitionDeadlift,
      pausedBench,
      competitionBench,
      barbellRow,
      competitionSquat,
    ]),
  );
  await insertTemplateAggregate(
    createTemplate("none", [pausedBench, barbellRow]),
  );

  const records = await getTemplateList();

  expect(records.find(({ id }) => id === "three")).toEqual({
    id: "three",
    name: "Bench day",
    description: null,
    competitionLifts: [
      competitionDeadlift,
      competitionBench,
      competitionSquat,
    ].map(({ id, name, liftFamily }) => ({ id, name, liftFamily })),
    lastExecution: null,
  });
  expect(records.find(({ id }) => id === "none")?.competitionLifts).toEqual([]);
});

it("returns every template sorted by updated time then descending ID using two reads", async () => {
  for (let index = 0; index < 55; index += 1) {
    const template = createTemplate(
      `template_${String(index).padStart(2, "0")}`,
    );
    template.template.updatedAt = index === 0 ? 2000 : 1000;
    template.template.description = "A saved routine";
    await insertTemplateAggregate(template);
  }
  queries.length = 0;

  const records = await getTemplateList();

  expect(records).toHaveLength(55);
  expect(records.slice(0, 3).map(({ id }) => id)).toEqual([
    "template_00",
    "template_54",
    "template_53",
  ]);
  expect(records[0].description).toBe("A saved routine");
  expect(queries.filter((query) => query.startsWith("select"))).toHaveLength(2);
  expect(queries.join(" ")).not.toMatch(
    /template_sets|workout_sets|workout_exercises/,
  );
});

it("uses both timestamps from the latest completed execution, resolving ties by ID", async () => {
  await insertTemplateAggregate(createTemplate("template_1"));
  await insertTemplateAggregate(createTemplate("fresh"));
  const startedAt = new Date(2026, 8, 23, 23, 30).getTime();
  const finishedAt = new Date(2026, 8, 24, 0, 45).getTime();
  const base = {
    sourceTemplateId: "template_1",
    status: "completed" as const,
    createdAt: 0,
    updatedAt: 0,
  };
  db.insert(workoutsTable)
    .values([
      {
        ...base,
        id: "older",
        startedAt: startedAt - 100_000,
        finishedAt: finishedAt - 1,
      },
      { ...base, id: "latest_a", startedAt: startedAt + 5000, finishedAt },
      { ...base, id: "latest_z", startedAt, finishedAt },
      {
        ...base,
        id: "active",
        status: "active",
        startedAt: finishedAt + 10_000,
        finishedAt: null,
      },
      {
        ...base,
        id: "unfinished",
        startedAt: finishedAt + 20_000,
        finishedAt: null,
      },
      {
        ...base,
        id: "other",
        sourceTemplateId: "deleted_template",
        startedAt,
        finishedAt: finishedAt + 30_000,
      },
      {
        ...base,
        id: "quick",
        sourceTemplateId: null,
        startedAt,
        finishedAt: finishedAt + 40_000,
      },
    ])
    .run();

  const records = await getTemplateList();

  expect(records.find(({ id }) => id === "template_1")?.lastExecution).toEqual({
    startedAt,
    finishedAt,
  });
  expect(records.find(({ id }) => id === "fresh")?.lastExecution).toBeNull();

  testDatabase.exec("DELETE FROM workouts WHERE id = 'latest_z';");
  const refreshed = await getTemplateList();
  expect(
    refreshed.find(({ id }) => id === "template_1")?.lastExecution,
  ).toEqual({
    startedAt: startedAt + 5000,
    finishedAt,
  });
});
