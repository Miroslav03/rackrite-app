import {
  createTemplate as createFixture,
  freezeTemplate,
} from "@/domain/templates/editor/tests/templates.test.helpers";
import { createEmptyTemplate } from "@/domain/templates/editor/templates.useCases";
import { createTemplate } from "../createTemplate";

it("persists the validated aggregate without changing its metadata or timestamps", async () => {
  const template = freezeTemplate(createFixture());
  const repository = {
    insertTemplateAggregate: jest.fn(async () => undefined),
  };

  await createTemplate({ repository }, template);

  expect(repository.insertTemplateAggregate).toHaveBeenCalledTimes(1);
  expect(repository.insertTemplateAggregate).toHaveBeenCalledWith(template);
});

it("rejects empty and unnamed templates before persistence", async () => {
  const repository = { insertTemplateAggregate: jest.fn() };
  const template = createFixture();
  template.template.name = "  ";

  await expect(createTemplate({ repository }, template)).rejects.toThrow(
    "name",
  );
  await expect(
    createTemplate(
      { repository },
      createEmptyTemplate({ id: "empty", now: 0 }),
    ),
  ).rejects.toThrow("at least one exercise");
  expect(repository.insertTemplateAggregate).not.toHaveBeenCalled();
});

it("propagates persistence errors", async () => {
  const error = new Error("Disk full");
  const repository = {
    insertTemplateAggregate: jest.fn().mockRejectedValue(error),
  };

  await expect(createTemplate({ repository }, createFixture())).rejects.toBe(
    error,
  );
});
