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

    it("should fuzzy match unquoted character names", () => {
      const result = parseQuery("char:climb");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].characterIds).toEqual([14]); // Matches "Ice Climbers"
      expect(result.errors).toHaveLength(0);
    });

    it("should return ALL fuzzy matches for character names (no exact match)", () => {
      const result = parseQuery("char:mar");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].characterIds).toHaveLength(3);
      expect(result.filters.playerFilters?.[0].characterIds).toContain(8); // Mario
      expect(result.filters.playerFilters?.[0].characterIds).toContain(9); // Marth
      expect(result.filters.playerFilters?.[0].characterIds).toContain(22); // Dr. Mario
      expect(result.errors).toHaveLength(0);
    });

    it("should return only exact match when available (not fuzzy)", () => {
      const result = parseQuery("char:falco");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].characterIds).toEqual([20]); // Only Falco, not Captain Falcon
      expect(result.errors).toHaveLength(0);
    });

    it("should match character by shortName (falcon -> Captain Falcon)", () => {
      const result = parseQuery("char:falcon");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].characterIds).toEqual([0]); // Only Captain Falcon (ID 0), not Falco
      expect(result.errors).toHaveLength(0);
    });

    it("should match character by shortName (puff -> Jigglypuff)", () => {
      const result = parseQuery("char:puff");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].characterIds).toEqual([15]); // Only Jigglypuff (ID 15)
      expect(result.errors).toHaveLength(0);
    });

    it("should match character by shortName (dk -> Donkey Kong)", () => {
      const result = parseQuery("char:dk");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].characterIds).toEqual([1]); // Donkey Kong (ID 1)
      expect(result.errors).toHaveLength(0);
    });

    it("should require exact match for quoted character names", () => {
      const result = parseQuery('char:"climb"');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("INVALID_VALUE");
      expect(result.errors[0].message).toContain("exact match");
    });

    it("should allow exact match with quoted normalized name", () => {
      const result = parseQuery('char:"ice_climbers"');
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].characterIds).toEqual([14]); // Exact match
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Stage filters", () => {
    it("should parse single stage", () => {
      const result = parseQuery("stage:battlefield");
      expect(result.filters.stageIds).toEqual([31]); // Battlefield ID
      expect(result.errors).toHaveLength(0);
    });

    it("should parse multiple stages with comma", () => {
      const result = parseQuery("stage:battlefield,final_destination");
      expect(result.filters.stageIds).toEqual([31, 32]); // Battlefield, Final Destination IDs
      expect(result.errors).toHaveLength(0);
    });

    it("should handle stage with accented characters", () => {
      const result = parseQuery("stage:pokemon_stadium");
      expect(result.filters.stageIds).toEqual([3]); // Pokémon Stadium ID
      expect(result.errors).toHaveLength(0);
    });

    it("should handle stage with spaces as underscores", () => {
      const result = parseQuery("stage:yoshis_story");
      expect(result.filters.stageIds).toEqual([8]); // Yoshi's Story ID
      expect(result.errors).toHaveLength(0);
    });

    it("should fuzzy match unquoted stage names", () => {
      const result = parseQuery("stage:battle");
      expect(result.filters.stageIds).toEqual([31]); // Matches "Battlefield"
      expect(result.errors).toHaveLength(0);
    });

    it("should return ALL fuzzy matches for stage names", () => {
      const result = parseQuery("stage:dream");
      expect(result.filters.stageIds).toHaveLength(2);
      expect(result.filters.stageIds).toContain(2); // Fountain of Dreams
      expect(result.filters.stageIds).toContain(28); // Dream Land N64
      expect(result.errors).toHaveLength(0);
    });

    it("should return ALL fuzzy matches for 'land'", () => {
      const result = parseQuery("stage:land");
      expect(result.filters.stageIds).toHaveLength(3);
      expect(result.filters.stageIds).toContain(16); // Yoshi's Island
      expect(result.filters.stageIds).toContain(28); // Dream Land N64
      expect(result.filters.stageIds).toContain(29); // Yoshi's Island N64
      expect(result.errors).toHaveLength(0);
    });

    it("should fuzzy match partial stage names", () => {
      const result = parseQuery("stage:yoshi");
      // Should match all stages with "yoshi" in the name
      expect(result.filters.stageIds).toContain(8); // Yoshi's Story
      expect(result.errors).toHaveLength(0);
    });

    it("should fuzzy match 'fountain' to only Fountain of Dreams", () => {
      const result = parseQuery("stage:fountain");
      expect(result.filters.stageIds).toEqual([2]); // Only matches "Fountain of Dreams"
      expect(result.errors).toHaveLength(0);
    });

    it("should require exact match for quoted stage names", () => {
      const result = parseQuery('stage:"battle"');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("INVALID_VALUE");
      expect(result.errors[0].message).toContain("exact match");
    });

    it("should allow exact match with quoted full name", () => {
      const result = parseQuery('stage:"battlefield"');
      expect(result.filters.stageIds).toEqual([31]); // Exact match
      expect(result.errors).toHaveLength(0);
    });

    it("should convert stage filter to ReplayFilter", () => {
      const parsed = parseQuery("stage:battlefield");
      const filters = convertToReplayFilters(parsed.filters);

      expect(filters).toHaveLength(1);
      expect(filters[0].type).toBe("stage");
      expect(filters[0]).toMatchObject({
        type: "stage",
        stageIds: [31],
      });
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

    it("should parse unquoted tag with fuzzy matching (default)", () => {
      const result = parseQuery("tag:aklo");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].tag).toBe("aklo");
      expect(result.filters.playerFilters?.[0].tagExact).toBeUndefined(); // Fuzzy is default
      expect(result.errors).toHaveLength(0);
    });

    it("should parse quoted tag with exact matching", () => {
      const result = parseQuery('tag:"aklo"');
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].tag).toBe("aklo");
      expect(result.filters.playerFilters?.[0].tagExact).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse winner with connect code", () => {
      const result = parseQuery("winner:MANG#0");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].connectCode).toBe("MANG#0");
      expect(result.filters.playerFilters?.[0].mustBeWinner).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse winner with unquoted tag (fuzzy - default)", () => {
      const result = parseQuery("winner:Mango");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].tag).toBe("Mango");
      expect(result.filters.playerFilters?.[0].tagExact).toBeUndefined(); // Fuzzy is default
      expect(result.filters.playerFilters?.[0].mustBeWinner).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse winner with quoted tag (exact)", () => {
      const result = parseQuery('winner:"Mango"');
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].tag).toBe("Mango");
      expect(result.filters.playerFilters?.[0].tagExact).toBe(true);
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

  describe("Empty filter values", () => {
    it("should ignore filter keys with colon but no value", () => {
      const result = parseQuery("char:");
      expect(result.filters.playerFilters).toBeUndefined();
      expect(result.filters.textSearch).toBeUndefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should ignore stage filter with colon but no value", () => {
      const result = parseQuery("stage:");
      expect(result.filters.stageIds).toBeUndefined();
      expect(result.filters.textSearch).toBeUndefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should treat filter key WITHOUT colon as free text search", () => {
      const result = parseQuery("char");
      expect(result.filters.textSearch).toBe("char");
      expect(result.filters.playerFilters).toBeUndefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should treat stage WITHOUT colon as free text search", () => {
      const result = parseQuery("stage");
      expect(result.filters.textSearch).toBe("stage");
      expect(result.filters.stageIds).toBeUndefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should allow partial matches of filter keys as free text", () => {
      const result = parseQuery("chara");
      expect(result.filters.textSearch).toBe("chara");
      expect(result.filters.playerFilters).toBeUndefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should ignore multiple empty filters with colons", () => {
      const result = parseQuery("char: stage: code:");
      expect(result.filters.playerFilters).toBeUndefined();
      expect(result.filters.stageIds).toBeUndefined();
      expect(result.filters.textSearch).toBeUndefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should process valid filters and ignore empty ones with colons", () => {
      const result = parseQuery("char:fox stage: minDuration:30s");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].characterIds).toEqual([2]);
      expect(result.filters.stageIds).toBeUndefined();
      expect(result.filters.minDuration).toBe(1800);
      expect(result.errors).toHaveLength(0);
    });

    it("should process text search with empty filters", () => {
      const result = parseQuery("mango char: stage:");
      expect(result.filters.textSearch).toBe("mango");
      expect(result.filters.playerFilters).toBeUndefined();
      expect(result.filters.stageIds).toBeUndefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should allow filter keys as text search when mixed with other text", () => {
      const result = parseQuery("char stage mango");
      expect(result.filters.textSearch).toBe("char stage mango");
      expect(result.errors).toHaveLength(0);
    });

    it("should ignore filter aliases with colons but no values", () => {
      const result = parseQuery("character: name:");
      expect(result.filters.playerFilters).toBeUndefined();
      expect(result.filters.textSearch).toBeUndefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should treat filter aliases WITHOUT colons as free text", () => {
      const result = parseQuery("character name");
      expect(result.filters.textSearch).toBe("character name");
      expect(result.filters.playerFilters).toBeUndefined();
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Negation (dash operator)", () => {
    it("should parse dash negation for character", () => {
      const result = parseQuery("-char:puff");
      expect(result.filters.excludeFilters).toBeDefined();
      expect(result.filters.excludeFilters?.playerFilters).toHaveLength(1);
      expect(result.filters.excludeFilters?.playerFilters?.[0].characterIds).toEqual([15]); // Puff ID
      expect(result.errors).toHaveLength(0);
    });

    it("should parse dash negation for stage", () => {
      const result = parseQuery("-stage:battlefield");
      expect(result.filters.excludeFilters).toBeDefined();
      expect(result.filters.excludeFilters?.stageIds).toEqual([31]); // Battlefield ID
      expect(result.errors).toHaveLength(0);
    });

    it("should parse dash negation for multiple characters", () => {
      const result = parseQuery("-char:fox,falco");
      expect(result.filters.excludeFilters).toBeDefined();
      expect(result.filters.excludeFilters?.playerFilters).toHaveLength(1);
      expect(result.filters.excludeFilters?.playerFilters?.[0].characterIds).toEqual([2, 20]); // Fox, Falco IDs
      expect(result.errors).toHaveLength(0);
    });

    it("should parse dash negation for port-specific character", () => {
      const result = parseQuery("-p1:fox");
      expect(result.filters.excludeFilters).toBeDefined();
      expect(result.filters.excludeFilters?.playerFilters).toHaveLength(1);
      expect(result.filters.excludeFilters?.playerFilters?.[0].port).toBe(1);
      expect(result.filters.excludeFilters?.playerFilters?.[0].characterIds).toEqual([2]);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse dash negation for duration", () => {
      const result = parseQuery("-minDuration:30s");
      expect(result.filters.excludeFilters).toBeDefined();
      expect(result.filters.excludeFilters?.minDuration).toBe(1800);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse dash negation for connect code", () => {
      const result = parseQuery("-code:MANG#0");
      expect(result.filters.excludeFilters).toBeDefined();
      expect(result.filters.excludeFilters?.playerFilters).toHaveLength(1);
      expect(result.filters.excludeFilters?.playerFilters?.[0].connectCode).toBe("MANG#0");
      expect(result.errors).toHaveLength(0);
    });

    it("should parse dash negation for tag", () => {
      const result = parseQuery("-tag:Mango");
      expect(result.filters.excludeFilters).toBeDefined();
      expect(result.filters.excludeFilters?.playerFilters).toHaveLength(1);
      expect(result.filters.excludeFilters?.playerFilters?.[0].tag).toBe("Mango");
      expect(result.errors).toHaveLength(0);
    });

    it("should parse dash negation for winner", () => {
      const result = parseQuery("-winner:MANG#0");
      expect(result.filters.excludeFilters).toBeDefined();
      expect(result.filters.excludeFilters?.playerFilters).toHaveLength(1);
      expect(result.filters.excludeFilters?.playerFilters?.[0].connectCode).toBe("MANG#0");
      expect(result.filters.excludeFilters?.playerFilters?.[0].mustBeWinner).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should combine positive and negative filters", () => {
      const result = parseQuery("char:fox -stage:battlefield");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].characterIds).toEqual([2]); // Fox
      expect(result.filters.excludeFilters).toBeDefined();
      expect(result.filters.excludeFilters?.stageIds).toEqual([31]); // Battlefield
      expect(result.errors).toHaveLength(0);
    });

    it("should handle multiple negations", () => {
      const result = parseQuery("-char:puff -stage:battlefield");
      expect(result.filters.excludeFilters).toBeDefined();
      expect(result.filters.excludeFilters?.playerFilters).toHaveLength(1);
      expect(result.filters.excludeFilters?.playerFilters?.[0].characterIds).toEqual([15]); // Puff
      expect(result.filters.excludeFilters?.stageIds).toEqual([31]); // Battlefield
      expect(result.errors).toHaveLength(0);
    });

    it("should handle negation with search text", () => {
      const result = parseQuery("mango -char:puff");
      expect(result.searchText).toEqual(["mango"]);
      expect(result.filters.textSearch).toBe("mango");
      expect(result.filters.excludeFilters).toBeDefined();
      expect(result.filters.excludeFilters?.playerFilters).toHaveLength(1);
      expect(result.filters.excludeFilters?.playerFilters?.[0].characterIds).toEqual([15]);
      expect(result.errors).toHaveLength(0);
    });

    it("should NOT treat standalone dash as negation operator", () => {
      const result = parseQuery("mango-man");
      expect(result.searchText).toEqual(["mango-man"]);
      expect(result.filters.excludeFilters).toBeUndefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should NOT treat dash in middle of text as negation", () => {
      const result = parseQuery("test-char:fox");
      // This should parse as a WORD "test-char:fox", not as negation
      expect(result.searchText).toContain("test-char:fox");
      expect(result.filters.excludeFilters).toBeUndefined();
    });

    it("should NOT negate search text with dash", () => {
      const result = parseQuery("- mango");
      // Dash not followed by filter key, so "mango" should be in search text
      expect(result.searchText).toContain("mango");
      expect(result.filters.excludeFilters).toBeUndefined();
    });

    it("should NO LONGER support NOT keyword", () => {
      // "NOT" should be treated as search text now
      const result = parseQuery("NOT char:puff");
      expect(result.searchText).toContain("NOT");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.excludeFilters).toBeUndefined();
      expect(result.errors).toHaveLength(0);
    });

    describe("convertToReplayFilters with negation", () => {
      it("should convert negated character filter", () => {
        const parsed = parseQuery("-char:puff");
        const filters = convertToReplayFilters(parsed.filters);

        expect(filters).toHaveLength(1);
        expect(filters[0].type).toBe("player");
        expect(filters[0].negate).toBe(true);
        expect(filters[0].characterIds).toEqual([15]);
      });

      it("should convert negated stage filter", () => {
        const parsed = parseQuery("-stage:battlefield");
        const filters = convertToReplayFilters(parsed.filters);

        expect(filters).toHaveLength(1);
        expect(filters[0].type).toBe("stage");
        expect(filters[0].negate).toBe(true);
        expect(filters[0].stageIds).toEqual([31]);
      });

      it("should convert mixed positive and negative filters", () => {
        const parsed = parseQuery("char:fox -stage:battlefield");
        const filters = convertToReplayFilters(parsed.filters);

        expect(filters).toHaveLength(2);

        const positiveFilter = filters.find((f) => !f.negate);
        expect(positiveFilter).toBeDefined();
        expect(positiveFilter?.type).toBe("player");
        expect(positiveFilter?.characterIds).toEqual([2]);

        const negativeFilter = filters.find((f) => f.negate);
        expect(negativeFilter).toBeDefined();
        expect(negativeFilter?.type).toBe("stage");
        expect(negativeFilter?.stageIds).toEqual([31]);
      });

      it("should convert multiple negated filters", () => {
        const parsed = parseQuery("-char:puff -stage:battlefield");
        const filters = convertToReplayFilters(parsed.filters);

        expect(filters).toHaveLength(2);
        expect(filters[0].negate).toBe(true);
        expect(filters[1].negate).toBe(true);

        const charFilter = filters.find((f) => f.type === "player");
        expect(charFilter).toBeDefined();
        expect(charFilter?.characterIds).toEqual([15]);

        const stageFilter = filters.find((f) => f.type === "stage");
        expect(stageFilter).toBeDefined();
        expect(stageFilter?.stageIds).toEqual([31]);
      });

      it("should convert negated duration filter", () => {
        const parsed = parseQuery("-minDuration:30s");
        const filters = convertToReplayFilters(parsed.filters);

        expect(filters).toHaveLength(1);
        expect(filters[0].type).toBe("duration");
        expect(filters[0].negate).toBe(true);
        expect(filters[0].minFrames).toBe(1800);
      });

      it("should convert negated player filters", () => {
        const parsed = parseQuery("-code:MANG#0");
        const filters = convertToReplayFilters(parsed.filters);

        expect(filters).toHaveLength(1);
        expect(filters[0].type).toBe("player");
        expect(filters[0].negate).toBe(true);
        expect(filters[0].connectCode).toBe("MANG#0");
      });

      it("should convert complex query with negation", () => {
        const parsed = parseQuery("mango char:fox -stage:battlefield minDuration:30s");
        const filters = convertToReplayFilters(parsed.filters);

        expect(filters.length).toBeGreaterThanOrEqual(3);

        const textFilter = filters.find((f) => f.type === "textSearch");
        expect(textFilter).toBeDefined();
        expect(textFilter?.query).toBe("mango");
        expect(textFilter?.negate).toBeUndefined();

        const charFilter = filters.find((f) => f.type === "player" && !f.negate);
        expect(charFilter).toBeDefined();
        expect(charFilter?.characterIds).toEqual([2]);

        const stageFilter = filters.find((f) => f.type === "stage");
        expect(stageFilter).toBeDefined();
        expect(stageFilter?.negate).toBe(true);
        expect(stageFilter?.stageIds).toEqual([31]);

        const durationFilter = filters.find((f) => f.type === "duration");
        expect(durationFilter).toBeDefined();
        expect(durationFilter?.minFrames).toBe(1800);
        expect(durationFilter?.negate).toBeUndefined();
      });
    });
  });
});
