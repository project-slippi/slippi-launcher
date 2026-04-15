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
    it("should parse duration with > operator (greater than)", () => {
      const result = parseQuery("duration:>30s");
      expect(result.filters.minDuration).toBe(1800); // 30 * 60 frames
      expect(result.errors).toHaveLength(0);
    });

    it("should parse duration with < operator (less than)", () => {
      const result = parseQuery("duration:<5m");
      expect(result.filters.maxDuration).toBe(18000); // 5 * 60 * 60 frames
      expect(result.errors).toHaveLength(0);
    });

    it("should parse duration without operator (defaults to min)", () => {
      const result = parseQuery("duration:30s");
      expect(result.filters.minDuration).toBe(1800); // 30 * 60 frames
      expect(result.errors).toHaveLength(0);
    });

    it("should parse duration in minutes", () => {
      const result = parseQuery("duration:>1m");
      expect(result.filters.minDuration).toBe(3600); // 1 * 60 * 60 frames
      expect(result.errors).toHaveLength(0);
    });

    it("should parse duration in frames", () => {
      const result = parseQuery("duration:>1800f");
      expect(result.filters.minDuration).toBe(1800);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse both > and < duration filters", () => {
      const result = parseQuery("duration:>30s duration:<4m");
      expect(result.filters.minDuration).toBe(1800);
      expect(result.filters.maxDuration).toBe(14400); // 4 * 60 * 60 frames
      expect(result.errors).toHaveLength(0);
    });

    it("should parse combined minutes and seconds", () => {
      const result = parseQuery("duration:1m30s");
      expect(result.filters.minDuration).toBe(5400); // (1 * 60 + 30) * 60 frames
      expect(result.errors).toHaveLength(0);
    });

    it("should parse combined hours and minutes", () => {
      const result = parseQuery("duration:1h30m");
      expect(result.filters.minDuration).toBe(324000); // (1 * 60 + 30) * 60 * 60 frames
      expect(result.errors).toHaveLength(0);
    });

    it("should parse combined hours, minutes, and seconds", () => {
      const result = parseQuery("duration:1h30m15s");
      expect(result.filters.minDuration).toBe(324900); // (1 * 3600 + 30 * 60 + 15) * 60 frames
      expect(result.errors).toHaveLength(0);
    });

    it("should parse combined duration with > operator", () => {
      const result = parseQuery("duration:>1m30s");
      expect(result.filters.minDuration).toBe(5400);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse combined duration with < operator", () => {
      const result = parseQuery("duration:<2h30m");
      expect(result.filters.maxDuration).toBe(540000); // (2 * 60 + 30) * 60 * 60 frames
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid unit order (seconds before minutes)", () => {
      const result = parseQuery("duration:30s1m");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("INVALID_VALUE");
      expect(result.errors[0].key).toBe("duration");
    });

    it("should reject invalid unit order (minutes after seconds)", () => {
      const result = parseQuery("duration:1s30m");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("INVALID_VALUE");
      expect(result.errors[0].key).toBe("duration");
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

    it("should match character by alias (falcon -> Captain Falcon)", () => {
      const result = parseQuery("char:falcon");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].characterIds).toEqual([0]); // Only Captain Falcon (ID 0), not Falco
      expect(result.errors).toHaveLength(0);
    });

    it("should match character by alias (puff -> Jigglypuff)", () => {
      const result = parseQuery("char:puff");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].characterIds).toEqual([15]); // Only Jigglypuff (ID 15)
      expect(result.errors).toHaveLength(0);
    });

    it("should match character by alias (dk -> Donkey Kong)", () => {
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

  describe("loser filter", () => {
    it("should parse loser with connect code", () => {
      const result = parseQuery("loser:MANG#0");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].connectCode).toBe("MANG#0");
      expect(result.filters.playerFilters?.[0].mustBeWinner).toBe(false);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse loser with unquoted tag (fuzzy - default)", () => {
      const result = parseQuery("loser:Mango");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].tag).toBe("Mango");
      expect(result.filters.playerFilters?.[0].tagExact).toBeUndefined();
      expect(result.filters.playerFilters?.[0].mustBeWinner).toBe(false);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse loser with quoted tag (exact)", () => {
      const result = parseQuery('loser:"Mango"');
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].tag).toBe("Mango");
      expect(result.filters.playerFilters?.[0].tagExact).toBe(true);
      expect(result.filters.playerFilters?.[0].mustBeWinner).toBe(false);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse winner:@me as userId filter", () => {
      const result = parseQuery("winner:@me");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].userId).toBe("@me");
      expect(result.filters.playerFilters?.[0].mustBeWinner).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse loser:@me as userId filter", () => {
      const result = parseQuery("loser:@me");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].userId).toBe("@me");
      expect(result.filters.playerFilters?.[0].mustBeWinner).toBe(false);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse standalone @me as userId filter", () => {
      const result = parseQuery("@me");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].userId).toBe("@me");
      expect(result.errors).toHaveLength(0);
    });

    it("should parse @me with mixed case as userId filter", () => {
      const result = parseQuery("@ME");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].userId).toBe("@me");
      expect(result.errors).toHaveLength(0);
    });

    it("should parse -@me as negated userId filter", () => {
      const result = parseQuery("-@me");
      expect(result.filters.excludeFilters).toBeDefined();
      expect(result.filters.excludeFilters?.playerFilters).toHaveLength(1);
      expect(result.filters.excludeFilters?.playerFilters?.[0].userId).toBe("@me");
      expect(result.errors).toHaveLength(0);
    });

    it("should parse -@ME as negated userId filter (case insensitive)", () => {
      const result = parseQuery("-@ME");
      expect(result.filters.excludeFilters).toBeDefined();
      expect(result.filters.excludeFilters?.playerFilters).toHaveLength(1);
      expect(result.filters.excludeFilters?.playerFilters?.[0].userId).toBe("@me");
      expect(result.errors).toHaveLength(0);
    });

    it("should parse @me with other filters", () => {
      const result = parseQuery("@me char:fox");
      expect(result.filters.playerFilters).toHaveLength(2);
      expect(result.filters.playerFilters?.[0].userId).toBe("@me");
      expect(result.filters.playerFilters?.[1].characterIds).toEqual([2]);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse -@me with other filters", () => {
      const result = parseQuery("-@me char:fox");
      expect(result.filters.excludeFilters?.playerFilters).toHaveLength(1);
      expect(result.filters.excludeFilters?.playerFilters?.[0].userId).toBe("@me");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].characterIds).toEqual([2]);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse @me followed by -@me", () => {
      const result = parseQuery("@me -@me");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].userId).toBe("@me");
      expect(result.filters.excludeFilters?.playerFilters).toHaveLength(1);
      expect(result.filters.excludeFilters?.playerFilters?.[0].userId).toBe("@me");
      expect(result.errors).toHaveLength(0);
    });

    it("should parse @me with stage filter", () => {
      const result = parseQuery("@me stage:FD");
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].userId).toBe("@me");
      expect(result.filters.stageIds).toEqual([32]);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Combined queries", () => {
    it("should parse search text with filters", () => {
      const result = parseQuery("mango char:fox duration:>30s");
      expect(result.searchText).toEqual(["mango"]);
      expect(result.filters.textSearch).toBe("mango");
      expect(result.filters.minDuration).toBe(1800);
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].characterIds).toEqual([2]);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse complex query", () => {
      const result = parseQuery("mango vs hbox char:fox,falco duration:>1m winner:MANG#0");
      expect(result.searchText).toEqual(["mango", "vs", "hbox"]);
      expect(result.filters.minDuration).toBe(3600);
      expect(result.filters.playerFilters).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse complex query", () => {
      const result = parseQuery("mango vs hbox char:fox,falco duration:>1m winner:MANG#0");
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
      const result = parseQuery("duration:invalid");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("INVALID_VALUE");
      expect(result.errors[0].key).toBe("duration");
    });
  });

  describe("Conversion to ReplayFilter[]", () => {
    it("should convert duration filter", () => {
      const parsed = parseQuery("duration:>30s");
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
      const parsed = parseQuery("mango char:fox duration:>30s");
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
      const result = parseQuery("char:fox stage: duration:>30s");
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

    it("should parse dash negation for duration", () => {
      const result = parseQuery("-duration:>30s");
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

    describe("convertToReplayFilters with negation", () => {
      it("should convert negated character filter", () => {
        const parsed = parseQuery("-char:puff");
        const filters = convertToReplayFilters(parsed.filters);

        expect(filters).toHaveLength(1);
        expect(filters[0].type).toBe("player");
        expect(filters[0].negate).toBe(true);
        if (filters[0].type === "player") {
          expect(filters[0].characterIds).toEqual([15]);
        }
      });

      it("should convert negated stage filter", () => {
        const parsed = parseQuery("-stage:battlefield");
        const filters = convertToReplayFilters(parsed.filters);

        expect(filters).toHaveLength(1);
        expect(filters[0].type).toBe("stage");
        expect(filters[0].negate).toBe(true);
        if (filters[0].type === "stage") {
          expect(filters[0].stageIds).toEqual([31]);
        }
      });

      it("should convert mixed positive and negative filters", () => {
        const parsed = parseQuery("char:fox -stage:battlefield");
        const filters = convertToReplayFilters(parsed.filters);

        expect(filters).toHaveLength(2);

        const positiveFilter = filters.find((f) => !f.negate);
        expect(positiveFilter).toBeDefined();
        expect(positiveFilter?.type).toBe("player");
        if (positiveFilter?.type === "player") {
          expect(positiveFilter.characterIds).toEqual([2]);
        }

        const negativeFilter = filters.find((f) => f.negate);
        expect(negativeFilter).toBeDefined();
        expect(negativeFilter?.type).toBe("stage");
        if (negativeFilter?.type === "stage") {
          expect(negativeFilter.stageIds).toEqual([31]);
        }
      });

      it("should convert multiple negated filters", () => {
        const parsed = parseQuery("-char:puff -stage:battlefield");
        const filters = convertToReplayFilters(parsed.filters);

        expect(filters).toHaveLength(2);
        expect(filters[0].negate).toBe(true);
        expect(filters[1].negate).toBe(true);

        const charFilter = filters.find((f) => f.type === "player");
        expect(charFilter).toBeDefined();
        if (charFilter?.type === "player") {
          expect(charFilter.characterIds).toEqual([15]);
        }

        const stageFilter = filters.find((f) => f.type === "stage");
        expect(stageFilter).toBeDefined();
        if (stageFilter?.type === "stage") {
          expect(stageFilter.stageIds).toEqual([31]);
        }
      });

      it("should convert negated duration filter", () => {
        const parsed = parseQuery("-duration:>30s");
        const filters = convertToReplayFilters(parsed.filters);

        expect(filters).toHaveLength(1);
        expect(filters[0].type).toBe("duration");
        expect(filters[0].negate).toBe(true);
        if (filters[0].type === "duration") {
          expect(filters[0].minFrames).toBe(1800);
        }
      });

      it("should convert negated player filters", () => {
        const parsed = parseQuery("-code:MANG#0");
        const filters = convertToReplayFilters(parsed.filters);

        expect(filters).toHaveLength(1);
        expect(filters[0].type).toBe("player");
        expect(filters[0].negate).toBe(true);
        if (filters[0].type === "player") {
          expect(filters[0].connectCode).toBe("MANG#0");
        }
      });

      it("should convert complex query with negation", () => {
        const parsed = parseQuery("mango char:fox -stage:battlefield duration:>30s");
        const filters = convertToReplayFilters(parsed.filters);

        expect(filters.length).toBeGreaterThanOrEqual(3);

        const textFilter = filters.find((f) => f.type === "textSearch");
        expect(textFilter).toBeDefined();
        if (textFilter?.type === "textSearch") {
          expect(textFilter.query).toBe("mango");
          expect(textFilter.negate).toBeUndefined();
        }

        const charFilter = filters.find((f) => f.type === "player" && !f.negate);
        expect(charFilter).toBeDefined();
        if (charFilter?.type === "player") {
          expect(charFilter.characterIds).toEqual([2]);
        }

        const stageFilter = filters.find((f) => f.type === "stage");
        expect(stageFilter).toBeDefined();
        if (stageFilter?.type === "stage") {
          expect(stageFilter.negate).toBe(true);
          expect(stageFilter.stageIds).toEqual([31]);
        }

        const durationFilter = filters.find((f) => f.type === "duration");
        expect(durationFilter).toBeDefined();
        if (durationFilter?.type === "duration") {
          expect(durationFilter.minFrames).toBe(1800);
          expect(durationFilter.negate).toBeUndefined();
        }
      });
    });
  });

  describe("Matchup filters (> syntax)", () => {
    it("should parse fox>marth (Fox beat Marth)", () => {
      const result = parseQuery("fox>marth");
      expect(result.filters.matchups).toHaveLength(1);
      expect(result.filters.matchups?.[0].winnerCharIds).toEqual([2]); // Fox
      expect(result.filters.matchups?.[0].loserCharIds).toEqual([9]); // Marth
      expect(result.errors).toHaveLength(0);
    });

    it("should parse fox> (Fox won - any opponent)", () => {
      const result = parseQuery("fox>");
      expect(result.filters.matchups).toHaveLength(1);
      expect(result.filters.matchups?.[0].winnerCharIds).toEqual([2]); // Fox
      expect(result.filters.matchups?.[0].loserCharIds).toBeUndefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should parse >marth (Marth lost - any opponent)", () => {
      const result = parseQuery(">marth");
      expect(result.filters.matchups).toHaveLength(1);
      expect(result.filters.matchups?.[0].winnerCharIds).toBeUndefined();
      expect(result.filters.matchups?.[0].loserCharIds).toEqual([9]); // Marth
      expect(result.errors).toHaveLength(0);
    });

    it("should parse multiple matchups", () => {
      const result = parseQuery("fox>marth falco>fox");
      expect(result.filters.matchups).toHaveLength(2);
      expect(result.filters.matchups?.[0].winnerCharIds).toEqual([2]); // Fox
      expect(result.filters.matchups?.[0].loserCharIds).toEqual([9]); // Marth
      expect(result.filters.matchups?.[1].winnerCharIds).toEqual([20]); // Falco
      expect(result.filters.matchups?.[1].loserCharIds).toEqual([2]); // Fox
      expect(result.errors).toHaveLength(0);
    });

    it("should parse matchup with stage filter", () => {
      const result = parseQuery("fox>marth stage:FD");
      expect(result.filters.matchups).toHaveLength(1);
      expect(result.filters.matchups?.[0].winnerCharIds).toEqual([2]);
      expect(result.filters.matchups?.[0].loserCharIds).toEqual([9]);
      expect(result.filters.stageIds).toEqual([32]); // Final Destination
      expect(result.errors).toHaveLength(0);
    });

    it("should parse matchup with character aliases", () => {
      const result = parseQuery("puff>marth");
      expect(result.filters.matchups).toHaveLength(1);
      expect(result.filters.matchups?.[0].winnerCharIds).toEqual([15]); // Jigglypuff
      expect(result.filters.matchups?.[0].loserCharIds).toEqual([9]); // Marth
      expect(result.errors).toHaveLength(0);
    });

    it("should parse fuzzy character match in matchup", () => {
      const result = parseQuery("climb>marth");
      // "climb" fuzzy matches Ice Climbers (id 14)
      expect(result.filters.matchups).toHaveLength(1);
      expect(result.filters.matchups?.[0].winnerCharIds).toEqual([14]); // Ice Climbers
      expect(result.filters.matchups?.[0].loserCharIds).toEqual([9]); // Marth
      expect(result.errors).toHaveLength(0);
    });

    it("should return error for invalid character in matchup", () => {
      const result = parseQuery("invalidchar>marth");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("INVALID_VALUE");
    });

    it("should allow matchup combined with text search", () => {
      const result = parseQuery("mango fox>marth");
      expect(result.searchText).toContain("mango");
      expect(result.filters.matchups).toHaveLength(1);
      expect(result.filters.matchups?.[0].winnerCharIds).toEqual([2]);
      expect(result.filters.matchups?.[0].loserCharIds).toEqual([9]);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Conversion to ReplayFilter[] with matchups", () => {
    it("should convert fox>marth to matchup filter (correlated)", () => {
      const parsed = parseQuery("fox>marth");
      const filters = convertToReplayFilters(parsed.filters);

      // Should have ONE matchup filter that ensures both conditions are met in the same game
      const matchupFilter = filters.find((f) => f.type === "matchup");
      expect(matchupFilter).toBeDefined();
      if (matchupFilter?.type === "matchup") {
        expect(matchupFilter.winnerCharIds).toEqual([2]); // Fox
        expect(matchupFilter.loserCharIds).toEqual([9]); // Marth
      }

      // Should NOT have separate winner/loser player filters (would cause false positives)
      const winnerFilter = filters.find((f) => f.type === "player" && f.mustBeWinner === true);
      expect(winnerFilter).toBeUndefined();

      const loserFilter = filters.find((f) => f.type === "player" && f.mustBeWinner === false);
      expect(loserFilter).toBeUndefined();
    });

    it("should convert fox> to single winner filter", () => {
      const parsed = parseQuery("fox>");
      const filters = convertToReplayFilters(parsed.filters);

      const winnerFilter = filters.find((f) => f.type === "player" && f.mustBeWinner === true);
      expect(winnerFilter).toBeDefined();
      if (winnerFilter?.type === "player") {
        expect(winnerFilter.characterIds).toEqual([2]);
      }

      // Should not have a loser filter
      const loserFilter = filters.find((f) => f.type === "player" && f.mustBeWinner === false);
      expect(loserFilter).toBeUndefined();
    });

    it("should convert >marth to single loser filter", () => {
      const parsed = parseQuery(">marth");
      const filters = convertToReplayFilters(parsed.filters);

      const loserFilter = filters.find((f) => f.type === "player" && f.mustBeWinner === false);
      expect(loserFilter).toBeDefined();
      if (loserFilter?.type === "player") {
        expect(loserFilter.characterIds).toEqual([9]);
      }

      // Should not have a winner filter
      const winnerFilter = filters.find((f) => f.type === "player" && f.mustBeWinner === true);
      expect(winnerFilter).toBeUndefined();
    });

    it("should convert fox>marth with stage to matchup + stage filters", () => {
      const parsed = parseQuery("fox>marth stage:FD");
      const filters = convertToReplayFilters(parsed.filters);

      // Should have matchup filter + stage filter (2 filters, not separate winner/loser)
      expect(filters.length).toBe(2);

      const matchupFilter = filters.find((f) => f.type === "matchup");
      expect(matchupFilter).toBeDefined();
      if (matchupFilter?.type === "matchup") {
        expect(matchupFilter.winnerCharIds).toEqual([2]);
        expect(matchupFilter.loserCharIds).toEqual([9]);
      }

      const stageFilter = filters.find((f) => f.type === "stage");
      expect(stageFilter).toBeDefined();
      if (stageFilter?.type === "stage") {
        expect(stageFilter.stageIds).toEqual([32]);
      }
    });
  });

  describe("Date filters", () => {
    it("should parse date with > operator (after date)", () => {
      const result = parseQuery("date:>2024-01-01");
      expect(result.filters.minDate).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should parse date with < operator (before date)", () => {
      const result = parseQuery("date:<2024-06-01");
      expect(result.filters.maxDateExclusive).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should parse date without operator (exact date)", () => {
      const result = parseQuery("date:2024-01-15");
      expect(result.filters.minDate).toBeDefined();
      expect(result.filters.maxDateExclusive).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should parse date with >= operator (on or after)", () => {
      const result = parseQuery("date:>=2024-01-01");
      expect(result.filters.minDate).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should parse date with <= operator (on or before)", () => {
      const result = parseQuery("date:<=2024-12-31");
      expect(result.filters.maxDate).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should parse date range with separate > and < filters", () => {
      const result = parseQuery("date:>2024-01-01 date:<2024-12-31");
      expect(result.filters.minDate).toBeDefined();
      expect(result.filters.maxDateExclusive).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should return error for invalid date format", () => {
      const result = parseQuery("date:2024/01/15");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("INVALID_VALUE");
    });

    it("should return error for invalid month", () => {
      const result = parseQuery("date:2024-13-01");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("INVALID_VALUE");
    });

    it("should return error for invalid day", () => {
      const result = parseQuery("date:2024-01-32");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("INVALID_VALUE");
    });

    it("should allow date combined with character filter", () => {
      const result = parseQuery("char:fox date:>2024-01-01");
      expect(result.filters.playerFilters).toBeDefined();
      expect(result.filters.minDate).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should allow date combined with text search", () => {
      const result = parseQuery("mango date:>2024-01-01");
      expect(result.searchText).toContain("mango");
      expect(result.filters.minDate).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should parse year-only date (exact match = entire year)", () => {
      const result = parseQuery("date:2026");
      expect(result.filters.minDate).toBeDefined();
      expect(result.filters.maxDateExclusive).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should parse year-month date (exact match = entire month)", () => {
      const result = parseQuery("date:2025-02");
      expect(result.filters.minDate).toBeDefined();
      expect(result.filters.maxDateExclusive).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should parse year-month with > operator", () => {
      const result = parseQuery("date:>2025-02");
      expect(result.filters.minDate).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should parse year-month with < operator", () => {
      const result = parseQuery("date:<2025-06");
      expect(result.filters.maxDateExclusive).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should parse year-only with >= operator", () => {
      const result = parseQuery("date:>=2025");
      expect(result.filters.minDate).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should parse year-only with <= operator", () => {
      const result = parseQuery("date:<=2025");
      expect(result.filters.maxDate).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Date filter conversion to ReplayFilter[]", () => {
    it("should convert date:>2024-01-01 to date filter with minDate", () => {
      const parsed = parseQuery("date:>2024-01-01");
      const filters = convertToReplayFilters(parsed.filters);

      const dateFilter = filters.find((f) => f.type === "date");
      expect(dateFilter).toBeDefined();
      if (dateFilter?.type === "date") {
        expect(dateFilter.minDate).toBeDefined();
        expect(dateFilter.maxDate).toBeUndefined();
      }
    });

    it("should convert date:<2024-12-31 to date filter with maxDateExclusive", () => {
      const parsed = parseQuery("date:<2024-12-31");
      const filters = convertToReplayFilters(parsed.filters);

      const dateFilter = filters.find((f) => f.type === "date");
      expect(dateFilter).toBeDefined();
      if (dateFilter?.type === "date") {
        expect(dateFilter.minDate).toBeUndefined();
        expect(dateFilter.maxDate).toBeUndefined();
        expect(dateFilter.maxDateExclusive).toBeDefined();
      }
    });

    it("should convert exact date to filter with minDate and maxDateExclusive", () => {
      const parsed = parseQuery("date:2024-01-15");
      const filters = convertToReplayFilters(parsed.filters);

      const dateFilter = filters.find((f) => f.type === "date");
      expect(dateFilter).toBeDefined();
      if (dateFilter?.type === "date") {
        expect(dateFilter.minDate).toBeDefined();
        expect(dateFilter.maxDate).toBeUndefined();
        expect(dateFilter.maxDateExclusive).toBeDefined();
      }
    });

    it("should convert date range with < to maxDateExclusive", () => {
      const parsed = parseQuery("date:>2024-01-01 date:<2024-12-31");
      const filters = convertToReplayFilters(parsed.filters);

      const dateFilter = filters.find((f) => f.type === "date");
      expect(dateFilter).toBeDefined();
      if (dateFilter?.type === "date") {
        expect(dateFilter.minDate).toBeDefined();
        expect(dateFilter.maxDate).toBeUndefined();
        expect(dateFilter.maxDateExclusive).toBeDefined();
      }
    });

    it("should convert year-only exact date to filter with minDate and maxDateExclusive", () => {
      const parsed = parseQuery("date:2026");
      const filters = convertToReplayFilters(parsed.filters);

      const dateFilter = filters.find((f) => f.type === "date");
      expect(dateFilter).toBeDefined();
      if (dateFilter?.type === "date") {
        expect(dateFilter.minDate).toBeDefined();
        expect(dateFilter.maxDate).toBeUndefined();
        expect(dateFilter.maxDateExclusive).toBeDefined();
      }
    });

    it("should convert year-month exact date to filter with minDate and maxDateExclusive", () => {
      const parsed = parseQuery("date:2025-02");
      const filters = convertToReplayFilters(parsed.filters);

      const dateFilter = filters.find((f) => f.type === "date");
      expect(dateFilter).toBeDefined();
      if (dateFilter?.type === "date") {
        expect(dateFilter.minDate).toBeDefined();
        expect(dateFilter.maxDate).toBeUndefined();
        expect(dateFilter.maxDateExclusive).toBeDefined();
      }
    });

    it("should convert negated date filter", () => {
      const parsed = parseQuery("-date:>2024-01-01");
      const filters = convertToReplayFilters(parsed.filters);

      const dateFilter = filters.find((f) => f.type === "date");
      expect(dateFilter).toBeDefined();
      if (dateFilter?.type === "date") {
        expect(dateFilter.negate).toBe(true);
      }
    });
  });

  describe("Game type filters (is:)", () => {
    it("should parse is:ranked", () => {
      const result = parseQuery("is:ranked");
      expect(result.filters.isRanked).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse is:unranked", () => {
      const result = parseQuery("is:unranked");
      expect(result.filters.isRanked).toBe(false);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse is:teams", () => {
      const result = parseQuery("is:teams");
      expect(result.filters.isTeams).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse is:doubles as alias for is:teams", () => {
      const result = parseQuery("is:doubles");
      expect(result.filters.isTeams).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse is:singles as alias for -is:teams", () => {
      const result = parseQuery("is:singles");
      expect(result.filters.isTeams).toBe(false);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse -is:ranked as negation (unranked)", () => {
      const result = parseQuery("-is:ranked");
      expect(result.filters.excludeFilters).toBeDefined();
      expect(result.filters.excludeFilters?.isRanked).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse -is:teams as negation (singles)", () => {
      const result = parseQuery("-is:teams");
      expect(result.filters.excludeFilters).toBeDefined();
      expect(result.filters.excludeFilters?.isTeams).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should combine is:ranked with other filters", () => {
      const result = parseQuery("is:ranked char:fox");
      expect(result.filters.isRanked).toBe(true);
      expect(result.filters.playerFilters).toHaveLength(1);
      expect(result.filters.playerFilters?.[0].characterIds).toEqual([2]);
      expect(result.errors).toHaveLength(0);
    });

    it("should combine -is:teams with text search", () => {
      const result = parseQuery("mango -is:teams");
      expect(result.searchText).toEqual(["mango"]);
      expect(result.filters.excludeFilters?.isTeams).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should allow is:ranked with is:teams", () => {
      const result = parseQuery("is:ranked is:teams");
      expect(result.filters.isRanked).toBe(true);
      expect(result.filters.isTeams).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Game type filter conversion to ReplayFilter[]", () => {
    it("should convert is:ranked to RankedFilter", () => {
      const parsed = parseQuery("is:ranked");
      const filters = convertToReplayFilters(parsed.filters);

      const rankedFilter = filters.find((f) => f.type === "ranked");
      expect(rankedFilter).toBeDefined();
      if (rankedFilter?.type === "ranked") {
        expect(rankedFilter.isRanked).toBe(true);
        expect(rankedFilter.negate).toBeUndefined();
      }
    });

    it("should convert is:unranked to RankedFilter with isRanked=false", () => {
      const parsed = parseQuery("is:unranked");
      const filters = convertToReplayFilters(parsed.filters);

      const rankedFilter = filters.find((f) => f.type === "ranked");
      expect(rankedFilter).toBeDefined();
      if (rankedFilter?.type === "ranked") {
        expect(rankedFilter.isRanked).toBe(false);
      }
    });

    it("should convert -is:ranked to RankedFilter with negate", () => {
      const parsed = parseQuery("-is:ranked");
      const filters = convertToReplayFilters(parsed.filters);

      const rankedFilter = filters.find((f) => f.type === "ranked");
      expect(rankedFilter).toBeDefined();
      if (rankedFilter?.type === "ranked") {
        expect(rankedFilter.isRanked).toBe(true);
        expect(rankedFilter.negate).toBe(true);
      }
    });

    it("should convert is:teams to TeamsFilter", () => {
      const parsed = parseQuery("is:teams");
      const filters = convertToReplayFilters(parsed.filters);

      const teamsFilter = filters.find((f) => f.type === "teams");
      expect(teamsFilter).toBeDefined();
      if (teamsFilter?.type === "teams") {
        expect(teamsFilter.isTeams).toBe(true);
      }
    });

    it("should convert is:doubles to TeamsFilter", () => {
      const parsed = parseQuery("is:doubles");
      const filters = convertToReplayFilters(parsed.filters);

      const teamsFilter = filters.find((f) => f.type === "teams");
      expect(teamsFilter).toBeDefined();
      if (teamsFilter?.type === "teams") {
        expect(teamsFilter.isTeams).toBe(true);
      }
    });

    it("should convert is:singles to TeamsFilter with isTeams=false", () => {
      const parsed = parseQuery("is:singles");
      const filters = convertToReplayFilters(parsed.filters);

      const teamsFilter = filters.find((f) => f.type === "teams");
      expect(teamsFilter).toBeDefined();
      if (teamsFilter?.type === "teams") {
        expect(teamsFilter.isTeams).toBe(false);
      }
    });

    it("should convert -is:teams to TeamsFilter with negate", () => {
      const parsed = parseQuery("-is:teams");
      const filters = convertToReplayFilters(parsed.filters);

      const teamsFilter = filters.find((f) => f.type === "teams");
      expect(teamsFilter).toBeDefined();
      if (teamsFilter?.type === "teams") {
        expect(teamsFilter.isTeams).toBe(true);
        expect(teamsFilter.negate).toBe(true);
      }
    });

    it("should convert combined is:ranked is:teams to both filters", () => {
      const parsed = parseQuery("is:ranked is:teams");
      const filters = convertToReplayFilters(parsed.filters);

      const rankedFilter = filters.find((f) => f.type === "ranked");
      expect(rankedFilter).toBeDefined();
      if (rankedFilter?.type === "ranked") {
        expect(rankedFilter.isRanked).toBe(true);
      }

      const teamsFilter = filters.find((f) => f.type === "teams");
      expect(teamsFilter).toBeDefined();
      if (teamsFilter?.type === "teams") {
        expect(teamsFilter.isTeams).toBe(true);
      }
    });
  });
});
