import { selectTemplateDetails } from "@/domain/templates/details/templates.selectors";
import { createTemplate } from "@/domain/templates/editor/tests/templates.test.helpers";
import { createTemplateDetailsViewModel } from "../templateDetails.viewModel";

it.each([
  [24, "Today"],
  [25, "Yesterday"],
  [28, "4 days ago"],
])("formats relative completion dates for day %s", (day, expected) => {
  const details = selectTemplateDetails(createTemplate(), {
    finishedAt: new Date(2026, 8, 24, 23).getTime(),
  });
  expect(
    createTemplateDetailsViewModel(
      details,
      new Date(2026, 8, day, 23, 30).getTime(),
    ).lastPerformed,
  ).toBe(expected);
});

it("formats targets and missing data without weight or volume fields", () => {
  const template = createTemplate();
  template.exercises[0].sets[0].rpe = 8;
  const view = createTemplateDetailsViewModel(
    selectTemplateDetails(template, null),
    0,
  );
  expect(view).toMatchObject({
    name: "Bench day",
    lastPerformed: "Never",
    totalSets: "4",
    averageRpe: "8",
  });
  expect(view.exercises[0]).toMatchObject({
    kind: "Competition Lift",
    sets: [
      { number: "01", reps: "5", rpe: "8" },
      { number: "02", rpe: "—" },
    ],
  });
  expect(view).not.toHaveProperty("totalVolume");
  expect(view.exercises[0].sets[0]).not.toHaveProperty("weight");
  expect(
    createTemplateDetailsViewModel(
      selectTemplateDetails(createTemplate(), null),
      0,
    ).averageRpe,
  ).toBe("—");
});
