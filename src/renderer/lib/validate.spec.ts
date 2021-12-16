import { isValidDisplayName } from "./validate";

describe("when validating display names", () => {
  it("should reject names with invalid characters", () => {
    expect(isValidDisplayName("}|\\}|\\|}|\\|}\\")).not.toEqual(true);
  });

  it("should reject names that are longer than 15 characters", () => {
    expect(isValidDisplayName("a".repeat(16))).not.toEqual(true);
  });
});
