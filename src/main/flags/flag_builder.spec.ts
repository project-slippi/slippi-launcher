import { FlagBuilder } from "./flag_builder";

enum Flags {
  ENABLE_FOO = "ENABLE_FOO",
  SOME_NUMBER_FIELD = "SOME_NUMBER_FIELD",
}

describe("when parsing flags", () => {
  it("overrides build flags with runtime flags", () => {
    const flags = getFlagsFromMockProcess({ [Flags.ENABLE_FOO]: "0" }, ["--enable-foo"]);
    expect(flags.enableFoo).toBeTruthy();
  });

  it("sets boolean runtime flags", () => {
    const flags = getFlagsFromMockProcess({ [Flags.ENABLE_FOO]: "1" }, ["--enable-foo=false"]);
    expect(flags.enableFoo).toBeFalsy();
  });

  describe("when environment variables are empty", () => {
    it("returns default flags", () => {
      const flags = getFlagsFromMockProcess({ [Flags.ENABLE_FOO]: "" });
      expect(flags.enableFoo).toBeFalsy();
    });
  });

  describe("when handling truthy flags", () => {
    it("parses true strings as true", () => {
      const flags = getFlagsFromMockProcess({ [Flags.ENABLE_FOO]: "true" });
      expect(flags.enableFoo).toBeTruthy();
    });

    it("parses 1 as true", () => {
      const flags = getFlagsFromMockProcess({ [Flags.ENABLE_FOO]: "1" });
      expect(flags.enableFoo).toBeTruthy();
    });
  });

  describe("when handling falsey flags", () => {
    it("parses undefined strings as false", () => {
      const flags = getFlagsFromMockProcess({ [Flags.ENABLE_FOO]: "UNDEFINED" });
      expect(flags.enableFoo).toBeFalsy();
    });

    it("parses false strings as false", () => {
      const flags = getFlagsFromMockProcess({ [Flags.ENABLE_FOO]: "FALSE" });
      expect(flags.enableFoo).toBeFalsy();
    });

    it("parses 0 as false", () => {
      const flags = getFlagsFromMockProcess({ [Flags.ENABLE_FOO]: "0" });
      expect(flags.enableFoo).toBeFalsy();
    });
  });

  describe("when invalid arguments are passed in", () => {
    it("parses valid arguments", () => {
      const flags = getFlagsFromMockProcess({}, ["--foo-bar-baz", "--enable-foo", "sdfsf", "", "--enable-foo"]);
      expect(flags.enableFoo).toBeTruthy();
    });
  });

  describe("when handling integer flags", () => {
    it("parses build time number flags", () => {
      const flags = getFlagsFromMockProcess({ [Flags.SOME_NUMBER_FIELD]: "10" });
      expect(flags.someNumberField).toEqual(10);
    });

    it("parses runtime number flags", () => {
      const flags = getFlagsFromMockProcess({}, ["--some-number-field=123"]);
      expect(flags.someNumberField).toEqual(123);
    });

    it("ignores empty runtime number flags", () => {
      const defaultFlags = getFlagsFromMockProcess({}, ["--some-number-field="]);
      expect(defaultFlags.someNumberField).toEqual(0);
      const configFlags = getFlagsFromMockProcess({ [Flags.SOME_NUMBER_FIELD]: "123" }, ["--some-number-field="]);
      expect(configFlags.someNumberField).toEqual(123);
    });

    it("overrides build time number flags", () => {
      const flags = getFlagsFromMockProcess({ [Flags.SOME_NUMBER_FIELD]: "10" }, ["--some-number-field=456"]);
      expect(flags.someNumberField).toEqual(456);
    });

    it("handles negative numbers", () => {
      const flags = getFlagsFromMockProcess({}, ["--some-number-field=-123"]);
      expect(flags.someNumberField).toEqual(-123);
    });
  });
});

function getFlagsFromMockProcess(variables: Record<string, string | undefined> = {}, args: string[] = []) {
  const env = { ...variables };
  const argv = ["current_executable", ...args];
  const mockProcess = { env, argv };

  const flags = new FlagBuilder(mockProcess)
    .addBooleanFlag("enableFoo", mockProcess.env[Flags.ENABLE_FOO], false)
    .withOverride("enableFoo", "--enable-foo")
    .addIntegerFlag("someNumberField", mockProcess.env[Flags.SOME_NUMBER_FIELD], 0)
    .withOverride("someNumberField", "--some-number-field")
    .build();

  return flags;
}
