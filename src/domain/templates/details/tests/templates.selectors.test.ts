import {
  createTemplate,
  freezeTemplate,
} from "../../editor/tests/templates.test.helpers";
import { selectTemplateDetails } from "../templates.selectors";

it("counts all planned sets but averages only rated non-warmup sets without mutating the template", () => {
  const template = createTemplate();
  template.exercises[0].sets[0].type = "warmup";
  template.exercises[0].sets[0].rpe = 3;
  template.exercises[0].sets[1].rpe = 8;
  template.exercises[1].sets[0].rpe = 9;
  const details = selectTemplateDetails(freezeTemplate(template), {
    finishedAt: 1234,
  });

  expect(details).toMatchObject({
    name: "Bench day",
    totalSets: 4,
    averageRpe: 8.5,
    lastExecution: { finishedAt: 1234 },
  });
  expect(details.exercises.map(({ id }) => id)).toEqual([
    "template_1_exercise_0",
    "template_1_exercise_1",
  ]);
  expect(details.exercises[0].sets[0]).not.toHaveProperty("weight");
});

it("returns no average when no non-warmup sets are rated", () => {
  const template = createTemplate();
  template.exercises[0].sets[0].type = "warmup";
  template.exercises[0].sets[0].rpe = 6;

  expect(selectTemplateDetails(template, null)).toMatchObject({
    totalSets: 4,
    averageRpe: null,
    lastExecution: null,
  });
});
