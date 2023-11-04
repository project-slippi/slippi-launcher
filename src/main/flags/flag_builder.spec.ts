import { FlagBuilder } from "./flag_builder";

type DummyFlags = {
  enableReplayDatabase: boolean;
};

enum DummyRuntimeFlags {
  ENABLE_REPLAY_DATABASE = "--enable-replay-database",
}

describe("when parsing flags", () => {
  describe("when environment variables are empty", () => {
    it("should return default flags", () => {
      const flags = getFlagsFromMockProcess({ ENABLE_REPLAY_DATABASE: "" });
      expect(flags.enableReplayDatabase).toBeFalsy();
    });
  });

  describe("when handling truthy flags", () => {
    it("should parse true strings as true", () => {
      const flags = getFlagsFromMockProcess({ ENABLE_REPLAY_DATABASE: "true" });
      expect(flags.enableReplayDatabase).toBeTruthy();
    });

    it("should parse 1 as true", () => {
      const flags = getFlagsFromMockProcess({ ENABLE_REPLAY_DATABASE: "1" });
      expect(flags.enableReplayDatabase).toBeTruthy();
    });
  });

  describe("when handling falsey flags", () => {
    it("should parse undefined strings as false", () => {
      const flags = getFlagsFromMockProcess({ ENABLE_REPLAY_DATABASE: "UNDEFINED" });
      expect(flags.enableReplayDatabase).toBeFalsy();
    });

    it("should parse false strings as false", () => {
      const flags = getFlagsFromMockProcess({ ENABLE_REPLAY_DATABASE: "FALSE" });
      expect(flags.enableReplayDatabase).toBeFalsy();
    });

    it("should parse 0 as false", () => {
      const flags = getFlagsFromMockProcess({ ENABLE_REPLAY_DATABASE: "0" });
      expect(flags.enableReplayDatabase).toBeFalsy();
    });
  });

  describe("when invalid arguments are passed in", () => {
    it("should correctly parse the valid arguments", () => {
      const flags = getFlagsFromMockProcess({}, [
        "--foo-bar-baz",
        DummyRuntimeFlags.ENABLE_REPLAY_DATABASE,
        "sdfsf",
        "",
        DummyRuntimeFlags.ENABLE_REPLAY_DATABASE,
      ]);
      expect(Object.keys(flags).length).toEqual(1);
      expect(flags.enableReplayDatabase).toBeTruthy();
    });
  });

  it("should override build flags with runtime flags", () => {
    const flags = getFlagsFromMockProcess({ ENABLE_REPLAY_DATABASE: "0" }, [DummyRuntimeFlags.ENABLE_REPLAY_DATABASE]);
    expect(flags.enableReplayDatabase).toBeTruthy();
  });
});

function getFlagsFromMockProcess(variables: Record<string, string | undefined> = {}, args: string[] = []): DummyFlags {
  const env = { ...variables };
  const argv = ["current_executable", ...args];

  const flags: DummyFlags = new FlagBuilder({ argv })
    .addBooleanFlag("enableReplayDatabase", env.ENABLE_REPLAY_DATABASE, false)
    .withOverride("enableReplayDatabase", DummyRuntimeFlags.ENABLE_REPLAY_DATABASE)
    .build();

  return flags;
}
