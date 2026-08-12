import {
  formatWeightDraft,
  parseWeightDraft,
  updateWeightDraft,
} from "./weightKeypad.utils";

describe("weight keypad utilities", () => {
  it("formats an existing weight as an editable draft", () => {
    expect(formatWeightDraft(102.5)).toBe("102.5");
    expect(formatWeightDraft(null)).toBe("");
  });

  it("builds a decimal weight and removes its last character", () => {
    let draft = "";

    for (const key of ["1", "0", "0", ".", "5"] as const) {
      draft = updateWeightDraft(draft, key);
    }

    expect(draft).toBe("100.5");
    expect(updateWeightDraft(draft, "delete")).toBe("100.");
  });

  it("clears the entire weight draft", () => {
    expect(updateWeightDraft("100.5", "clear")).toBe("");
  });

  it("allows only one decimal point and two decimal places", () => {
    expect(updateWeightDraft("100.5", ".")).toBe("100.5");
    expect(updateWeightDraft("100.55", "5")).toBe("100.55");
  });

  it("normalizes leading zero entry", () => {
    expect(updateWeightDraft("", ".")).toBe("0.");
    expect(updateWeightDraft("0", "5")).toBe("5");
  });

  it("parses a draft and treats an empty draft as no weight", () => {
    expect(parseWeightDraft("102.5")).toBe(102.5);
    expect(parseWeightDraft("")).toBeNull();
  });
});
