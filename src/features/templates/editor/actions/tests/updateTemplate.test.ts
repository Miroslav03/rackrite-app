import {
  createTemplate,
  freezeTemplate,
} from "@/domain/templates/editor/tests/templates.test.helpers";
import { updateTemplateSet } from "@/domain/templates/editor/templates.useCases";
import { updateTemplate } from "../updateTemplate";

it("persists the original and updated aggregates without changing their identities or timestamps", async () => {
  const previous = freezeTemplate(createTemplate());
  const next = freezeTemplate(
    updateTemplateSet(previous, {
      setId: previous.exercises[0].sets[0].id,
      reps: 8,
      now: 2000,
    }),
  );
  const repository = {
    updateTemplateAggregate: jest.fn(async () => undefined),
  };

  await updateTemplate({ repository }, previous, next);

  expect(repository.updateTemplateAggregate).toHaveBeenCalledTimes(1);
  expect(repository.updateTemplateAggregate.mock.calls[0]).toEqual([
    previous,
    next,
  ]);
  expect(previous.exercises[0].sets[0].reps).toBe(5);
  expect(next.template.id).toBe(previous.template.id);
  expect(next.template.createdAt).toBe(previous.template.createdAt);
});

it("rejects mismatched identities and invalid aggregates before persistence", async () => {
  const repository = { updateTemplateAggregate: jest.fn() };
  const original = createTemplate();
  const empty = { ...original, exercises: [] };
  const unnamed = {
    ...original,
    template: { ...original.template, name: " " },
  };

  await expect(
    updateTemplate({ repository }, original, createTemplate("other")),
  ).rejects.toThrow("different template ID");
  await expect(updateTemplate({ repository }, empty, original)).rejects.toThrow(
    "at least one exercise",
  );
  await expect(updateTemplate({ repository }, original, empty)).rejects.toThrow(
    "at least one exercise",
  );
  await expect(
    updateTemplate({ repository }, original, unnamed),
  ).rejects.toThrow("name");
  expect(repository.updateTemplateAggregate).not.toHaveBeenCalled();
});

it("allows an unchanged valid template and propagates persistence errors", async () => {
  const template = freezeTemplate(createTemplate());
  const error = new Error("Disk full");
  const repository = {
    updateTemplateAggregate: jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(error),
  };

  await updateTemplate({ repository }, template, template);
  expect(repository.updateTemplateAggregate).toHaveBeenCalledWith(
    template,
    template,
  );
  await expect(updateTemplate({ repository }, template, template)).rejects.toBe(
    error,
  );
});
