/**
 * Query Parser Tests
 *
 * Basic tests to verify the parser works correctly.
 * Run with: npm test -- parser.test.ts
 */

import { describe, expect, it } from "vitest";

import { convertToReplayFilters, parseQuery } from "./parser";

describe("Query Parser", () => {
  describe("Simple search text", () => {
    it("should parse simple search text", () => {
      const result = parseQuery("mango");
      expect(result.searchText).toEqual(["mango"]);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse quoted search text", () => {
      const result = parseQuery('"Liquid Hbox"');
      expect(result.searchText).toEqual(["Liquid Hbox"]);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse multiple search terms", () => {
      const result = parseQuery("mango vs hbox");
      expect(result.searchText).toEqual(["mango", "vs", "hbox"]);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Duration filters", () => {
    it("should parse minDuration in seconds", () => {
      const result = parseQuery("minDuration:30s");
      expect(result.filters.minDuration).toBe(1800); // 30 * 60 frames
      expect(result.errors).toHaveLength(0);
    });

    it("should parse minDuration in minutes", () => {
      const result = parseQuery("minDuration:1m");
      expect(result.filters.minDuration).toBe(3600); // 1 * 60 * 60 frames
      expect(result.errors).toHaveLength(0);
    });

    it("should parse minDuration in frames", () => {
      const result = parseQuery("minDuration:1800f");
      expect(result.filters.minDuration).toBe(1800);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse maxDuration", () => {
      const result = parseQuery("maxDuration:5m");
      expect(result.filters.maxDuration).toBe(18000); // 5 * 60 * 60 frames
      expect(result.errors).toHaveLength(0);
    });

    it("should parse both min and max duration", () => {
      const result = parseQuery("minDuration:30s maxDuration:5m");
      expect(result.filters.minDuration).toBe(1800);
      expect(result.filters.maxDuration).toBe(18000);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Character filters", () => {
    it("should parse single character", () => {
      const result = parseQuery("char:fox");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].characterIds).toEqual([2]); // Fox ID
      expect(result.errors).toHaveLength(0);
    });

    it("should parse multiple characters with comma", () => {
      const result = parseQuery("char:fox,falco");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].characterIds).toEqual([2, 20]); // Fox, Falco IDs
      expect(result.errors).toHaveLength(0);
    });

    it("should handle character alias", () => {
      const result = parseQuery("character:marth");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].characterIds).toEqual([9]); // Marth ID
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Port-specific filters", () => {
    it("should parse p1 port alias", () => {
      const result = parseQuery("p1:fox");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].port).toBe(1);
      expect(result.filters.playerFilters?.[0].characterIds).toEqual([2]);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse multiple port filters", () => {
      const result = parseQuery("p1:fox p2:marth");
      expect(result.filters.playerFilters).toHaveLength(2);
      expect(result.filters.playerFilters?.[0].port).toBe(1);
      expect(result.filters.playerFilters?.[0].characterIds).toEqual([2]);
      expect(result.filters.playerFilters?.[1].port).toBe(2);
      expect(result.filters.playerFilters?.[1].characterIds).toEqual([9]);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Player filters", () => {
    it("should parse connect code", () => {
      const result = parseQuery("code:MANG#0");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].connectCode).toBe("MANG#0");
      expect(result.errors).toHaveLength(0);
    });

    it("should parse tag", () => {
      const result = parseQuery("tag:Mango");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].tag).toBe("Mango");
      expect(result.errors).toHaveLength(0);
    });

    it("should parse winner with connect code", () => {
      const result = parseQuery("winner:MANG#0");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].connectCode).toBe("MANG#0");
      expect(result.filters.playerFilters?.[0].mustBeWinner).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse winner with tag", () => {
      const result = parseQuery("winner:Mango");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].tag).toBe("Mango");
      expect(result.filters.playerFilters?.[0].mustBeWinner).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Combined queries", () => {
    it("should parse search text with filters", () => {
      const result = parseQuery("mango char:fox minDuration:30s");
      expect(result.searchText).toEqual(["mango"]);
      expect(result.filters.textSearch).toBe("mango");
      expect(result.filters.minDuration).toBe(1800);
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].characterIds).toEqual([2]);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse complex query", () => {
      const result = parseQuery("mango vs hbox char:fox,falco minDuration:1m winner:MANG#0");
      expect(result.searchText).toEqual(["mango", "vs", "hbox"]);
      expect(result.filters.minDuration).toBe(3600);
      expect(result.filters.playerFilters).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Error handling", () => {
    it("should report invalid filter key", () => {
      const result = parseQuery("invalid:value");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("INVALID_KEY");
      expect(result.errors[0].key).toBe("invalid");
    });

    it("should report invalid character name", () => {
      const result = parseQuery("char:invalidchar");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("INVALID_VALUE");
      expect(result.errors[0].key).toBe("char");
    });

    it("should report invalid duration format", () => {
      const result = parseQuery("minDuration:invalid");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("INVALID_VALUE");
      expect(result.errors[0].key).toBe("minDuration");
    });
  });

  describe("Conversion to ReplayFilter[]", () => {
    it("should convert duration filter", () => {
      const parsed = parseQuery("minDuration:30s");
      const filters = convertToReplayFilters(parsed.filters);

      expect(filters).toHaveLength(1);
      expect(filters[0].type).toBe("duration");
      expect(filters[0]).toMatchObject({
        type: "duration",
        minFrames: 1800,
      });
    });

    it("should convert player filter", () => {
      const parsed = parseQuery("char:fox");
      const filters = convertToReplayFilters(parsed.filters);

      expect(filters).toHaveLength(1);
      expect(filters[0].type).toBe("player");
      expect(filters[0]).toMatchObject({
        type: "player",
        characterIds: [2],
      });
    });

    it("should convert text search filter", () => {
      const parsed = parseQuery("mango");
      const filters = convertToReplayFilters(parsed.filters);

      expect(filters).toHaveLength(1);
      expect(filters[0].type).toBe("textSearch");
      expect(filters[0]).toMatchObject({
        type: "textSearch",
        query: "mango",
      });
    });

    it("should convert complex query", () => {
      const parsed = parseQuery("mango char:fox minDuration:30s");
      const filters = convertToReplayFilters(parsed.filters);

      expect(filters).toHaveLength(3);

      const durationFilter = filters.find((f) => f.type === "duration");
      expect(durationFilter).toBeDefined();
      expect(durationFilter).toMatchObject({
        type: "duration",
        minFrames: 1800,
      });

      const playerFilter = filters.find((f) => f.type === "player");
      expect(playerFilter).toBeDefined();
      expect(playerFilter).toMatchObject({
        type: "player",
        characterIds: [2],
      });

      const textFilter = filters.find((f) => f.type === "textSearch");
      expect(textFilter).toBeDefined();
      expect(textFilter).toMatchObject({
        type: "textSearch",
        query: "mango",
      });
    });
  });

  describe("Negation (NOT operator)", () => {
    it("should parse NOT operator", () => {
      const result = parseQuery("NOT char:puff");
      expect(result.filters.excludeFilters).toBeDefined();
      expect(result.filters.excludeFilters?.playerFilters).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse dash negation", () => {
      const result = parseQuery("-char:puff");
      expect(result.filters.excludeFilters).toBeDefined();
      expect(result.filters.excludeFilters?.playerFilters).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    // Note: Negation is parsed but not yet converted to backend filters
    it("should not include negation in backend filters yet", () => {
      const parsed = parseQuery("NOT char:puff");
      const filters = convertToReplayFilters(parsed.filters);
      // Should not crash, but negation not yet implemented
      expect(filters).toBeDefined();
    });
  });
});
