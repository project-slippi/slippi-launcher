import { validateDisplayName } from "./validate";

describe("when validating display names", () => {
  it("should reject names with invalid characters", () => {
    expect(validateDisplayName("`}|\\}|\\|}|\\|}\\")).not.toEqual(true);
    expect(validateDisplayName("😀😁`")).not.toEqual(true);
    expect(validateDisplayName("攻撃")).not.toEqual(true);
    expect(validateDisplayName("Nóme")).not.toEqual(true);
  });

  it("should reject names that are longer than 15 characters", () => {
    expect(validateDisplayName("a".repeat(16))).not.toEqual(true);
  });

  it("should reject names that are 0 characters", () => {
    expect(validateDisplayName("")).not.toEqual(true);
  });

  it("should accept names that only contain spaces", () => {
    expect(validateDisplayName("   ")).toEqual(true);
  });

  it("should accept names that contain special characters", () => {
    expect(validateDisplayName("/,>.<(!=-_+*&^%")).toEqual(true);
    expect(validateDisplayName("$#@!~'\"}{|")).toEqual(true);
  });
});
