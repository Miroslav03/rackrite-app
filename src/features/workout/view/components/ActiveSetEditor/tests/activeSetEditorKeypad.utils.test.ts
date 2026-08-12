import {
  formatKeypadDraft,
  parseKeypadDraft,
  updateKeypadDraft,
} from "../activeSetEditorKeypad.utils";

describe("active set editor keypad utilities", () => {
  describe("shared behavior", () => {
    it("formats existing values and null drafts", () => {
      expect(formatKeypadDraft(102.5)).toBe("102.5");
      expect(formatKeypadDraft(12)).toBe("12");
      expect(formatKeypadDraft(null)).toBe("");
    });

    it.each(["weight", "reps"] as const)(
      "deletes and clears the %s draft",
      (mode) => {
        expect(updateKeypadDraft("105", "delete", mode)).toBe("10");
        expect(updateKeypadDraft("105", "clear", mode)).toBe("");
      },
    );

    it.each(["weight", "reps"] as const)(
      "limits the %s draft to six characters",
      (mode) => {
        expect(updateKeypadDraft("123456", "7", mode)).toBe("123456");
      },
    );

    it.each(["weight", "reps"] as const)(
      "treats an empty %s draft as no value",
      (mode) => {
        expect(parseKeypadDraft("", mode)).toBeNull();
      },
    );
  });

  describe("weight behavior", () => {
    it("builds a decimal draft", () => {
      let draft = "";

      for (const key of ["1", "0", "0", ".", "5"] as const) {
        draft = updateKeypadDraft(draft, key, "weight");
      }

      expect(draft).toBe("100.5");
    });

    it("allows only one decimal point and two decimal places", () => {
      expect(updateKeypadDraft("100.5", ".", "weight")).toBe("100.5");
      expect(updateKeypadDraft("100.55", "5", "weight")).toBe("100.55");
    });

    it("normalizes leading zero entry", () => {
      expect(updateKeypadDraft("", ".", "weight")).toBe("0.");
      expect(updateKeypadDraft("0", "5", "weight")).toBe("5");
    });

    it("parses a valid weight", () => {
      expect(parseKeypadDraft("102.5", "weight")).toBe(102.5);
    });
  });

  describe("reps behavior", () => {
    it("builds a positive whole-number draft including internal zeroes", () => {
      let draft = "";

      for (const key of ["1", "0", "5"] as const) {
        draft = updateKeypadDraft(draft, key, "reps");
      }

      expect(draft).toBe("105");
    });

    it("ignores a leading zero and decimal input", () => {
      expect(updateKeypadDraft("", "0", "reps")).toBe("");
      expect(updateKeypadDraft("12", ".", "reps")).toBe("12");
    });

    it("parses only positive whole numbers", () => {
      expect(parseKeypadDraft("12", "reps")).toBe(12);
      expect(parseKeypadDraft("0", "reps")).toBeNull();
      expect(parseKeypadDraft("1.5", "reps")).toBeNull();
    });
  });
});
