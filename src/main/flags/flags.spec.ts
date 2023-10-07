import { DEVELOPMENT_CONFIG_FLAGS, getConfigFlags } from "./flags";

describe("when parsing config flags", () => {
  describe("when in dev mode", () => {
    it("should return development flags", () => {
      const flags = getConfigFlags(mockProcessEnv({ NODE_ENV: "development" }));
      expect(flags.enableMainlineDolphin).toEqual(DEVELOPMENT_CONFIG_FLAGS.enableMainlineDolphin);
      expect(flags.enableReplayDatabase).toEqual(DEVELOPMENT_CONFIG_FLAGS.enableReplayDatabase);
    });
  });

  describe("when environment variables are empty", () => {
    it("should return default flags", () => {
      const flags = getConfigFlags(mockProcessEnv({ ENABLE_MAINLINE_DOLPHIN: "" }));
      expect(flags.enableMainlineDolphin).toBeFalsy();
      expect(flags.enableReplayDatabase).toBeFalsy();
    });
  });

  describe("when handling truthy flags", () => {
    it("should parse true strings as true", () => {
      const flags = getConfigFlags(mockProcessEnv({ ENABLE_MAINLINE_DOLPHIN: "true" }));
      expect(flags.enableMainlineDolphin).toBeTruthy();
    });

    it("should parse 1 as true", () => {
      const flags = getConfigFlags(mockProcessEnv({ ENABLE_MAINLINE_DOLPHIN: "1" }));
      expect(flags.enableMainlineDolphin).toBeTruthy();
    });
  });

  describe("when handling falsey flags", () => {
    it("should parse undefined strings as false", () => {
      const flags = getConfigFlags(mockProcessEnv({ ENABLE_MAINLINE_DOLPHIN: "UNDEFINED" }));
      expect(flags.enableMainlineDolphin).toBeFalsy();
    });

    it("should parse false strings as false", () => {
      const flags = getConfigFlags(mockProcessEnv({ ENABLE_MAINLINE_DOLPHIN: "FALSE" }));
      expect(flags.enableMainlineDolphin).toBeFalsy();
    });

    it("should parse 0 as false", () => {
      const flags = getConfigFlags(mockProcessEnv({ ENABLE_MAINLINE_DOLPHIN: "0" }));
      expect(flags.enableMainlineDolphin).toBeFalsy();
    });
  });
});

function mockProcessEnv(variables: Record<string, string | undefined>) {
  return {
    env: {
      ...variables,
    },
  };
}
