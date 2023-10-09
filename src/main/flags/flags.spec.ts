import { getConfigFlags, RuntimeFlags } from "./flags";

describe("when parsing flags", () => {
  let originalArgv: string[];
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Back up the args and the env
    originalArgv = process.argv;
    originalEnv = process.env;
  });

  afterEach(() => {
    // Restore the args and the env
    process.argv = originalArgv;
    process.env = originalEnv;
  });

  describe("when environment variables are empty", () => {
    it("should return default flags", () => {
      mockProcess({ ENABLE_MAINLINE_DOLPHIN: "" });
      const flags = getConfigFlags();
      expect(flags.enableMainlineDolphin).toBeFalsy();
      expect(flags.enableReplayDatabase).toBeFalsy();
    });
  });

  describe("when handling truthy flags", () => {
    it("should parse true strings as true", () => {
      mockProcess({ ENABLE_MAINLINE_DOLPHIN: "true" });
      const flags = getConfigFlags();
      expect(flags.enableMainlineDolphin).toBeTruthy();
    });

    it("should parse 1 as true", () => {
      mockProcess({ ENABLE_MAINLINE_DOLPHIN: "1" });
      const flags = getConfigFlags();
      expect(flags.enableMainlineDolphin).toBeTruthy();
    });
  });

  describe("when handling falsey flags", () => {
    it("should parse undefined strings as false", () => {
      mockProcess({ ENABLE_MAINLINE_DOLPHIN: "UNDEFINED" });
      const flags = getConfigFlags();
      expect(flags.enableMainlineDolphin).toBeFalsy();
    });

    it("should parse false strings as false", () => {
      mockProcess({ ENABLE_MAINLINE_DOLPHIN: "FALSE" });
      const flags = getConfigFlags();
      expect(flags.enableMainlineDolphin).toBeFalsy();
    });

    it("should parse 0 as false", () => {
      mockProcess({ ENABLE_MAINLINE_DOLPHIN: "0" });
      const flags = getConfigFlags();
      expect(flags.enableMainlineDolphin).toBeFalsy();
    });
  });

  describe("when invalid arguments are passed in", () => {
    it("should correctly parse the valid arguments", () => {
      mockProcess({}, [
        "--foo-bar-baz",
        RuntimeFlags.ENABLE_MAINLINE_DOLPHIN,
        "sdfsf",
        "",
        RuntimeFlags.ENABLE_REPLAY_DATABASE,
      ]);
      const flags = getConfigFlags();
      expect(Object.keys(flags).length).toEqual(2);
      expect(flags.enableMainlineDolphin).toBeTruthy();
      expect(flags.enableReplayDatabase).toBeTruthy();
    });
  });

  it("should override build flags with runtime flags", () => {
    mockProcess({ ENABLE_MAINLINE_DOLPHIN: "0" }, [RuntimeFlags.ENABLE_MAINLINE_DOLPHIN]);
    const flags = getConfigFlags();
    expect(flags.enableMainlineDolphin).toBeTruthy();
    expect(flags.enableReplayDatabase).toBeFalsy();
  });
});

function mockProcess(variables: Record<string, string | undefined> = {}, args: string[] = []) {
  process.env = { ...variables };
  process.argv = ["current_executable", ...args];
}
