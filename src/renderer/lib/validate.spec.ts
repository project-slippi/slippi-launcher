import { isValidDisplayName } from "./validate";

describe("when validating display names", () => {
  it("should reject invalid names", () => {
    expect(isValidDisplayName("}|\\}|\\|}|\\|}\\")).toBeFalsy();
  });
});
