import { getConfigFlags } from "./flags";

describe("when parsing config flags", () => {
  describe("when handling truthy flags", () => {
    it("should parse true strings as true", () => {
      const flags = getConfigFlags({ env: { ENABLE_MAINLINE_DOLPHIN: "true" } });
      expect(flags.enableMainlineDolphin).toBeTruthy();
    });

    it("should parse 1 as true", () => {
      const flags = getConfigFlags({ env: { ENABLE_MAINLINE_DOLPHIN: "1" } });
      expect(flags.enableMainlineDolphin).toBeTruthy();
    });
  });

  describe("when handling falsey flags", () => {
    it("should parse undefined strings as false", () => {
      const flags = getConfigFlags({ env: { ENABLE_MAINLINE_DOLPHIN: "undefined" } });
      expect(flags.enableMainlineDolphin).toBeFalsy();
    });

    it("should parse false strings as false", () => {
      const flags = getConfigFlags({ env: { ENABLE_MAINLINE_DOLPHIN: "false" } });
      expect(flags.enableMainlineDolphin).toBeFalsy();
    });

    it("should parse 0 as false", () => {
      const flags = getConfigFlags({ env: { ENABLE_MAINLINE_DOLPHIN: "0" } });
      expect(flags.enableMainlineDolphin).toBeFalsy();
    });

    it("should parse empty string as false", () => {
      const flags = getConfigFlags({ env: { ENABLE_MAINLINE_DOLPHIN: "" } });
      expect(flags.enableMainlineDolphin).toBeFalsy();
    });

    it("should parse undefined as false", () => {
      const flags = getConfigFlags({ env: {} });
      expect(flags.enableMainlineDolphin).toBeFalsy();
    });
  });
});
