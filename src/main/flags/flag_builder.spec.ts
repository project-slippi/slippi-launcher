import { FlagBuilder } from "./flag_builder";

describe("when parsing flags", () => {
  describe("when environment variables are empty", () => {
    it("should return default flags", () => {
      const flags = getFlagsFromMockProcess({ ENABLE_FOO: "" });
      expect(flags.enableFoo).toBeFalsy();
    });
  });

  describe("when handling truthy flags", () => {
    it("should parse true strings as true", () => {
      const flags = getFlagsFromMockProcess({ ENABLE_FOO: "true" });
      expect(flags.enableFoo).toBeTruthy();
    });

    it("should parse 1 as true", () => {
      const flags = getFlagsFromMockProcess({ ENABLE_FOO: "1" });
      expect(flags.enableFoo).toBeTruthy();
    });
  });

  describe("when handling falsey flags", () => {
    it("should parse undefined strings as false", () => {
      const flags = getFlagsFromMockProcess({ ENABLE_FOO: "UNDEFINED" });
      expect(flags.enableFoo).toBeFalsy();
    });

    it("should parse false strings as false", () => {
      const flags = getFlagsFromMockProcess({ ENABLE_FOO: "FALSE" });
      expect(flags.enableFoo).toBeFalsy();
    });

    it("should parse 0 as false", () => {
      const flags = getFlagsFromMockProcess({ ENABLE_FOO: "0" });
      expect(flags.enableFoo).toBeFalsy();
    });
  });

  describe("when invalid arguments are passed in", () => {
    it("should correctly parse the valid arguments", () => {
      const flags = getFlagsFromMockProcess({}, ["--foo-bar-baz", "--enable-foo", "sdfsf", "", "--enable-foo"]);
      expect(Object.keys(flags).length).toEqual(1);
      expect(flags.enableFoo).toBeTruthy();
    });
  });

  it("should override build flags with runtime flags", () => {
    const flags = getFlagsFromMockProcess({ ENABLE_FOO: "0" }, ["--enable-foo"]);
    expect(flags.enableFoo).toBeTruthy();
  });
});

function getFlagsFromMockProcess(variables: Record<string, string | undefined> = {}, args: string[] = []) {
  const env = { ...variables };
  const argv = ["current_executable", ...args];

  const flags = new FlagBuilder({ argv })
    .addBooleanFlag("enableFoo", env.ENABLE_FOO, false)
    .withOverride("enableFoo", "--enable-foo")
    .build();

  return flags;
}
