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
      mockProcess({ ENABLE_REPLAY_DATABASE: "" });
      const flags = getConfigFlags();
      expect(flags.enableReplayDatabase).toBeFalsy();
    });
  });

  describe("when handling truthy flags", () => {
    it("should parse true strings as true", () => {
      mockProcess({ ENABLE_REPLAY_DATABASE: "true" });
      const flags = getConfigFlags();
      expect(flags.enableReplayDatabase).toBeTruthy();
    });

    it("should parse 1 as true", () => {
      mockProcess({ ENABLE_REPLAY_DATABASE: "1" });
      const flags = getConfigFlags();
      expect(flags.enableReplayDatabase).toBeTruthy();
    });
  });

  describe("when handling falsey flags", () => {
    it("should parse undefined strings as false", () => {
      mockProcess({ ENABLE_REPLAY_DATABASE: "UNDEFINED" });
      const flags = getConfigFlags();
      expect(flags.enableReplayDatabase).toBeFalsy();
    });

    it("should parse false strings as false", () => {
      mockProcess({ ENABLE_REPLAY_DATABASE: "FALSE" });
      const flags = getConfigFlags();
      expect(flags.enableReplayDatabase).toBeFalsy();
    });

    it("should parse 0 as false", () => {
      mockProcess({ ENABLE_REPLAY_DATABASE: "0" });
      const flags = getConfigFlags();
      expect(flags.enableReplayDatabase).toBeFalsy();
    });
  });

  describe("when invalid arguments are passed in", () => {
    it("should correctly parse the valid arguments", () => {
      mockProcess({}, [
        "--foo-bar-baz",
        RuntimeFlags.ENABLE_REPLAY_DATABASE,
        "sdfsf",
        "",
        RuntimeFlags.ENABLE_REPLAY_DATABASE,
      ]);
      const flags = getConfigFlags();
      expect(Object.keys(flags).length).toEqual(1);
      expect(flags.enableReplayDatabase).toBeTruthy();
    });
  });

  it("should override build flags with runtime flags", () => {
    mockProcess({ ENABLE_REPLAY_DATABASE: "0" }, [RuntimeFlags.ENABLE_REPLAY_DATABASE]);
    const flags = getConfigFlags();
    expect(flags.enableReplayDatabase).toBeTruthy();
  });
});

function mockProcess(variables: Record<string, string | undefined> = {}, args: string[] = []) {
  process.env = { ...variables };
  process.argv = ["current_executable", ...args];
}
