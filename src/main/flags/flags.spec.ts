import { getBuildFlags, getConfigFlags, getRuntimeFlags, RuntimeFlags } from "./flags";

describe("when parsing build flags", () => {
  describe("when environment variables are empty", () => {
    it("should return default flags", () => {
      const flags = getBuildFlags(mockProcess({ ENABLE_MAINLINE_DOLPHIN: "" }));
      expect(flags.enableMainlineDolphin).toBeFalsy();
      expect(flags.enableReplayDatabase).toBeFalsy();
    });
  });

  describe("when handling truthy flags", () => {
    it("should parse true strings as true", () => {
      const flags = getBuildFlags(mockProcess({ ENABLE_MAINLINE_DOLPHIN: "true" }));
      expect(flags.enableMainlineDolphin).toBeTruthy();
    });

    it("should parse 1 as true", () => {
      const flags = getBuildFlags(mockProcess({ ENABLE_MAINLINE_DOLPHIN: "1" }));
      expect(flags.enableMainlineDolphin).toBeTruthy();
    });
  });

  describe("when handling falsey flags", () => {
    it("should parse undefined strings as false", () => {
      const flags = getBuildFlags(mockProcess({ ENABLE_MAINLINE_DOLPHIN: "UNDEFINED" }));
      expect(flags.enableMainlineDolphin).toBeFalsy();
    });

    it("should parse false strings as false", () => {
      const flags = getBuildFlags(mockProcess({ ENABLE_MAINLINE_DOLPHIN: "FALSE" }));
      expect(flags.enableMainlineDolphin).toBeFalsy();
    });

    it("should parse 0 as false", () => {
      const flags = getBuildFlags(mockProcess({ ENABLE_MAINLINE_DOLPHIN: "0" }));
      expect(flags.enableMainlineDolphin).toBeFalsy();
    });
  });
});

describe("when parsing runtime flags", () => {
  describe("when process arguments are empty", () => {
    it("should return no overrides", () => {
      const runtimeFlags = getRuntimeFlags(mockProcess());
      expect(Object.keys(runtimeFlags).length).toEqual(0);
    });
  });

  describe("when invalid arguments are passed in", () => {
    it("should ignore invalid arguments", () => {
      const runtimeFlags = getRuntimeFlags(mockProcess({}, ["--foo-bar-baz", "asdfsfasdf", ""]));
      expect(Object.keys(runtimeFlags).length).toEqual(0);
    });

    it("should correctly parse valid arguments", () => {
      const runtimeFlags = getRuntimeFlags(
        mockProcess({}, [
          "--foo-bar-baz",
          RuntimeFlags.ENABLE_MAINLINE_DOLPHIN,
          "sdfsf",
          "",
          RuntimeFlags.ENABLE_REPLAY_DATABASE,
        ]),
      );
      expect(Object.keys(runtimeFlags).length).toEqual(2);
      expect(runtimeFlags.enableMainlineDolphin).toBeTruthy();
      expect(runtimeFlags.enableReplayDatabase).toBeTruthy();
    });
  });
});

describe("when parsing config flags", () => {
  it("should override build flags with runtime flags", () => {
    const flags = getConfigFlags(mockProcess({ ENABLE_MAINLINE_DOLPHIN: "0" }, [RuntimeFlags.ENABLE_MAINLINE_DOLPHIN]));
    expect(flags.enableMainlineDolphin).toBeTruthy();
    expect(flags.enableReplayDatabase).toBeFalsy();
  });
});

function mockProcess(variables: Record<string, string | undefined> = {}, args: string[] = []) {
  return {
    env: {
      ...variables,
    },
    argv: ["current_executable", ...args],
  };
}
