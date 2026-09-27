import { loadTemplates } from "../loadTemplates";

it("loads the full list and maps raw execution timestamps into card summaries", async () => {
  const getTemplateList = jest.fn(async () => [
    {
      id: "template_1",
      name: "Bench day",
      description: null,
      competitionLifts: [],
      lastExecution: { startedAt: 0, finishedAt: 4_500_000 },
    },
  ]);

  await expect(loadTemplates({ getTemplateList })).resolves.toEqual([
    {
      id: "template_1",
      name: "Bench day",
      description: null,
      competitionLifts: [],
      lastExecution: { finishedAt: 4_500_000, durationMinutes: 75 },
    },
  ]);
  expect(getTemplateList).toHaveBeenCalledTimes(1);
  expect(getTemplateList).toHaveBeenCalledWith();
});

it("lets read failures reach the controller instead of reporting an empty library", async () => {
  const error = new Error("Database unavailable");
  await expect(
    loadTemplates({
      getTemplateList: async () => {
        throw error;
      },
    }),
  ).rejects.toBe(error);
});
