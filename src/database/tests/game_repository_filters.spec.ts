import type { ReplayFilter } from "@database/filters/types";
import type { Database } from "@database/schema";
import type { Kysely } from "kysely";

import { FileRepository } from "../repositories/file_repository";
import { GameRepository } from "../repositories/game_repository";
import { PlayerRepository } from "../repositories/player_repository";
import { aMockFileWith, aMockGameWith, aMockPlayerWith } from "./mocks";
import { closeTestDb, initTestDb, resetTestDb } from "./test_db";

describe("GameRepository.searchGames with filters", () => {
  let db: Kysely<Database>;

  beforeAll(async () => {
    db = await initTestDb();
  });

  afterEach(async () => {
    await resetTestDb(db);
  });

  afterAll(async () => {
    await closeTestDb(db);
  });

  describe("DurationFilter", () => {
    it("should filter games by minimum duration", async () => {
      const folder = "/replays";

      // Add games with different durations
      await addGameWithDuration(folder, "short.slp", 1000); // 16.6 seconds
      await addGameWithDuration(folder, "medium.slp", 1800); // 30 seconds
      await addGameWithDuration(folder, "long.slp", 3600); // 60 seconds

      const filters: ReplayFilter[] = [{ type: "duration", minFrames: 1800 }];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toEqual(expect.arrayContaining(["medium.slp", "long.slp"]));
    });

    it("should filter games by maximum duration", async () => {
      const folder = "/replays";

      await addGameWithDuration(folder, "short.slp", 1000);
      await addGameWithDuration(folder, "medium.slp", 1800);
      await addGameWithDuration(folder, "long.slp", 3600);

      const filters: ReplayFilter[] = [{ type: "duration", maxFrames: 2000 }];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toEqual(expect.arrayContaining(["short.slp", "medium.slp"]));
    });

    it("should filter games by duration range", async () => {
      const folder = "/replays";

      await addGameWithDuration(folder, "short.slp", 1000);
      await addGameWithDuration(folder, "medium1.slp", 1800);
      await addGameWithDuration(folder, "medium2.slp", 2400);
      await addGameWithDuration(folder, "long.slp", 5000);

      const filters: ReplayFilter[] = [{ type: "duration", minFrames: 1800, maxFrames: 3000 }];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toEqual(expect.arrayContaining(["medium1.slp", "medium2.slp"]));
    });

    it("should always include stadium modes regardless of duration", async () => {
      const folder = "/replays";

      // Add short stadium games
      await addGameWithDuration(folder, "short_target.slp", 100, 0x0f); // TARGET_TEST = 15
      await addGameWithDuration(folder, "short_homerun.slp", 100, 0x20); // HOME_RUN_CONTEST = 32

      // Add short regular game
      await addGameWithDuration(folder, "short_vs.slp", 100, 0x02); // VS = 2

      const filters: ReplayFilter[] = [{ type: "duration", minFrames: 1800 }];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      // Stadium games should be included despite being short
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toEqual(expect.arrayContaining(["short_target.slp", "short_homerun.slp"]));
    });

    it("should include games with null duration", async () => {
      const folder = "/replays";

      await addGameWithDuration(folder, "short.slp", 100);
      await addGameWithDuration(folder, "unknown.slp", null);

      const filters: ReplayFilter[] = [{ type: "duration", minFrames: 1800 }];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("unknown.slp");
    });
  });

  describe("PlayerFilter", () => {
    it("should filter games by connect code", async () => {
      const folder = "/replays";
      const { gameId: game1 } = await addGame(folder, "game1.slp");
      const { gameId: game2 } = await addGame(folder, "game2.slp");
      const { gameId: game3 } = await addGame(folder, "game3.slp");

      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game1, { connect_code: "MANG#0" }));
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game2, { connect_code: "PPMD#0" }));
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game3, { connect_code: "MANG#0" }));

      const filters: ReplayFilter[] = [{ type: "player", connectCode: "MANG#0" }];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toEqual(expect.arrayContaining(["game1.slp", "game3.slp"]));
    });

    it("should filter games by user ID", async () => {
      const folder = "/replays";
      const { gameId: game1 } = await addGame(folder, "game1.slp");
      const { gameId: game2 } = await addGame(folder, "game2.slp");

      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game1, { user_id: "user123" }));
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game2, { user_id: "user456" }));

      const filters: ReplayFilter[] = [{ type: "player", userId: "user123" }];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("game1.slp");
    });

    it("should filter games by display name", async () => {
      const folder = "/replays";
      const { gameId: game1 } = await addGame(folder, "game1.slp");
      const { gameId: game2 } = await addGame(folder, "game2.slp");

      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game1, { display_name: "Mango" }));
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game2, { display_name: "PPMD" }));

      const filters: ReplayFilter[] = [{ type: "player", displayName: "Mango" }];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("game1.slp");
    });

    it("should filter games by tag", async () => {
      const folder = "/replays";
      const { gameId: game1 } = await addGame(folder, "game1.slp");
      const { gameId: game2 } = await addGame(folder, "game2.slp");

      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game1, { tag: "C9" }));
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game2, { tag: "EG" }));

      const filters: ReplayFilter[] = [{ type: "player", tag: "C9" }];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("game1.slp");
    });

    it("should filter games where player won", async () => {
      const folder = "/replays";
      const { gameId: game1 } = await addGame(folder, "game1.slp");
      const { gameId: game2 } = await addGame(folder, "game2.slp");
      const { gameId: game3 } = await addGame(folder, "game3.slp");

      // Mango wins game1
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game1, { connect_code: "MANG#0", is_winner: 1 }));

      // Mango loses game2
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game2, { connect_code: "MANG#0", is_winner: 0 }));

      // Mango wins game3
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game3, { connect_code: "MANG#0", is_winner: 1 }));

      const filters: ReplayFilter[] = [{ type: "player", connectCode: "MANG#0", mustBeWinner: true }];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toEqual(expect.arrayContaining(["game1.slp", "game3.slp"]));
    });

    it("should use AND logic for multiple player identifiers", async () => {
      const folder = "/replays";
      const { gameId: game1 } = await addGame(folder, "game1.slp");
      const { gameId: game2 } = await addGame(folder, "game2.slp");
      const { gameId: game3 } = await addGame(folder, "game3.slp");

      // Game with matching connect code but wrong display name
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game1, {
          connect_code: "MANG#0",
          display_name: "Joseph",
        }),
      );

      // Game with matching connect code AND display name
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game2, {
          connect_code: "MANG#0",
          display_name: "Mango",
        }),
      );

      // Game with wrong connect code but matching display name
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game3, {
          connect_code: "PPMD#0",
          display_name: "Mango",
        }),
      );

      const filters: ReplayFilter[] = [{ type: "player", connectCode: "MANG#0", displayName: "Mango" }];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      // Only game2 should match (both conditions must be true - AND logic)
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("game2.slp");
    });

    it("should require all player conditions to match the same player", async () => {
      const folder = "/replays";
      const { gameId: game1 } = await addGame(folder, "game1.slp");

      // Add two players to the same game - neither individually matches all criteria
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game1, {
          port: 1,
          connect_code: "MANG#0",
          display_name: "Joseph",
          is_winner: 1,
        }),
      );
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game1, {
          port: 2,
          connect_code: "PPMD#0",
          display_name: "Mango",
          is_winner: 0,
        }),
      );

      // Filter requires all three attributes to match
      const filters: ReplayFilter[] = [
        {
          type: "player",
          connectCode: "MANG#0",
          displayName: "Mango",
          mustBeWinner: true,
        },
      ];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      // Should NOT match because no single player has all three attributes
      expect(results).toHaveLength(0);
    });

    it("should filter games by port number", async () => {
      const folder = "/replays";
      const { gameId: game1 } = await addGame(folder, "game1.slp");
      const { gameId: game2 } = await addGame(folder, "game2.slp");
      const { gameId: game3 } = await addGame(folder, "game3.slp");

      // Game 1: Mango port 1, PPMD port 2
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game1, { port: 1, connect_code: "MANG#0" }));
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game1, { port: 2, connect_code: "PPMD#0" }));

      // Game 2: Mango port 2, PPMD port 1
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game2, { port: 2, connect_code: "MANG#0" }));
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game2, { port: 1, connect_code: "PPMD#0" }));

      // Game 3: Armada port 1, PPMD port 2
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game3, { port: 1, connect_code: "ARMA#0" }));
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game3, { port: 2, connect_code: "PPMD#0" }));

      // Find games where Mango was port 1
      const filters: ReplayFilter[] = [{ type: "player", connectCode: "MANG#0", port: 1 }];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      // Only game1 matches (Mango in port 1)
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("game1.slp");
    });

    it("should filter games where specific port won", async () => {
      const folder = "/replays";
      const { gameId: game1 } = await addGame(folder, "game1.slp");
      const { gameId: game2 } = await addGame(folder, "game2.slp");

      // Game 1: Port 1 wins
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game1, {
          port: 1,
          connect_code: "MANG#0",
          is_winner: 1,
        }),
      );
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game1, {
          port: 2,
          connect_code: "PPMD#0",
          is_winner: 0,
        }),
      );

      // Game 2: Port 2 wins
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game2, {
          port: 1,
          connect_code: "MANG#0",
          is_winner: 0,
        }),
      );
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game2, {
          port: 2,
          connect_code: "PPMD#0",
          is_winner: 1,
        }),
      );

      // Find games where port 1 won
      const filters: ReplayFilter[] = [{ type: "player", port: 1, mustBeWinner: true }];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("game1.slp");
    });

    it("should filter games where mang0 was port 1 and won", async () => {
      const folder = "/replays";
      const { gameId: game1 } = await addGame(folder, "game1.slp");
      const { gameId: game2 } = await addGame(folder, "game2.slp");
      const { gameId: game3 } = await addGame(folder, "game3.slp");

      // Game 1: Mango port 1 wins
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game1, {
          port: 1,
          connect_code: "MANG#0",
          is_winner: 1,
        }),
      );

      // Game 2: Mango port 2 wins (wrong port)
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game2, {
          port: 2,
          connect_code: "MANG#0",
          is_winner: 1,
        }),
      );

      // Game 3: Mango port 1 loses (didn't win)
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game3, {
          port: 1,
          connect_code: "MANG#0",
          is_winner: 0,
        }),
      );

      // Find games where Mango was port 1 and won
      const filters: ReplayFilter[] = [{ type: "player", connectCode: "MANG#0", port: 1, mustBeWinner: true }];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      // Only game1 matches all conditions
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("game1.slp");
    });

    it("should filter games by character", async () => {
      const folder = "/replays";
      const FOX = 2;
      const FALCO = 20;
      const MARTH = 13;

      const { gameId: game1 } = await addGame(folder, "game1.slp");
      const { gameId: game2 } = await addGame(folder, "game2.slp");
      const { gameId: game3 } = await addGame(folder, "game3.slp");

      // Game 1: Fox player
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game1, { connect_code: "MANG#0", character_id: FOX }));

      // Game 2: Falco player
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game2, { connect_code: "MANG#0", character_id: FALCO }));

      // Game 3: Marth player
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game3, { connect_code: "MANG#0", character_id: MARTH }));

      // Find games where anyone played Fox
      const filters: ReplayFilter[] = [{ type: "player", characterIds: [FOX] }];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("game1.slp");
    });

    it("should filter games by multiple characters with OR logic", async () => {
      const folder = "/replays";
      const FOX = 2;
      const FALCO = 20;
      const MARTH = 13;

      const { gameId: game1 } = await addGame(folder, "game1.slp");
      const { gameId: game2 } = await addGame(folder, "game2.slp");
      const { gameId: game3 } = await addGame(folder, "game3.slp");

      // Game 1: Fox player
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game1, { connect_code: "MANG#0", character_id: FOX }));

      // Game 2: Falco player
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game2, { connect_code: "MANG#0", character_id: FALCO }));

      // Game 3: Marth player
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game3, { connect_code: "MANG#0", character_id: MARTH }));

      // Find games where anyone played Fox OR Falco
      const filters: ReplayFilter[] = [{ type: "player", characterIds: [FOX, FALCO] }];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toEqual(expect.arrayContaining(["game1.slp", "game2.slp"]));
    });

    it("should filter games where specific player played specific character", async () => {
      const folder = "/replays";
      const FOX = 2;
      const FALCO = 20;

      const { gameId: game1 } = await addGame(folder, "game1.slp");
      const { gameId: game2 } = await addGame(folder, "game2.slp");
      const { gameId: game3 } = await addGame(folder, "game3.slp");

      // Game 1: Mango plays Fox
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game1, { connect_code: "MANG#0", character_id: FOX }));

      // Game 2: Mango plays Falco
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game2, { connect_code: "MANG#0", character_id: FALCO }));

      // Game 3: PPMD plays Fox (wrong player)
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game3, { connect_code: "PPMD#0", character_id: FOX }));

      // Find games where Mango played Fox
      const filters: ReplayFilter[] = [{ type: "player", connectCode: "MANG#0", characterIds: [FOX] }];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("game1.slp");
    });

    it("should filter games where player played specific character and won", async () => {
      const folder = "/replays";
      const FOX = 2;
      const FALCO = 20;

      const { gameId: game1 } = await addGame(folder, "game1.slp");
      const { gameId: game2 } = await addGame(folder, "game2.slp");
      const { gameId: game3 } = await addGame(folder, "game3.slp");

      // Game 1: Mango plays Fox and wins
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game1, {
          connect_code: "MANG#0",
          character_id: FOX,
          is_winner: 1,
        }),
      );

      // Game 2: Mango plays Fox and loses
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game2, {
          connect_code: "MANG#0",
          character_id: FOX,
          is_winner: 0,
        }),
      );

      // Game 3: Mango plays Falco and wins
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game3, {
          connect_code: "MANG#0",
          character_id: FALCO,
          is_winner: 1,
        }),
      );

      // Find games where Mango played Fox OR Falco and won
      const filters: ReplayFilter[] = [
        {
          type: "player",
          connectCode: "MANG#0",
          characterIds: [FOX, FALCO],
          mustBeWinner: true,
        },
      ];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toEqual(expect.arrayContaining(["game1.slp", "game3.slp"]));
    });

    it("should filter games where mang0 played fox and won against zain's marth", async () => {
      const folder = "/replays";
      const FOX = 2;
      const FALCO = 20;
      const MARTH = 13;
      const SHEIK = 18;

      const { gameId: game1 } = await addGame(folder, "game1.slp");
      const { gameId: game2 } = await addGame(folder, "game2.slp");
      const { gameId: game3 } = await addGame(folder, "game3.slp");
      const { gameId: game4 } = await addGame(folder, "game4.slp");

      // Game 1: Mango Fox wins vs Zain Marth ✓
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game1, {
          port: 1,
          connect_code: "MANG#0",
          character_id: FOX,
          is_winner: 1,
        }),
      );
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game1, {
          port: 2,
          connect_code: "ZAIN#0",
          character_id: MARTH,
          is_winner: 0,
        }),
      );

      // Game 2: Mango Fox loses vs Zain Marth (didn't win)
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game2, {
          port: 1,
          connect_code: "MANG#0",
          character_id: FOX,
          is_winner: 0,
        }),
      );
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game2, {
          port: 2,
          connect_code: "ZAIN#0",
          character_id: MARTH,
          is_winner: 1,
        }),
      );

      // Game 3: Mango Falco wins vs Zain Marth (wrong character)
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game3, {
          port: 1,
          connect_code: "MANG#0",
          character_id: FALCO,
          is_winner: 1,
        }),
      );
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game3, {
          port: 2,
          connect_code: "ZAIN#0",
          character_id: MARTH,
          is_winner: 0,
        }),
      );

      // Game 4: Mango Fox wins vs Zain Sheik (wrong character for Zain)
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game4, {
          port: 1,
          connect_code: "MANG#0",
          character_id: FOX,
          is_winner: 1,
        }),
      );
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game4, {
          port: 2,
          connect_code: "ZAIN#0",
          character_id: SHEIK,
          is_winner: 0,
        }),
      );

      // Find games where Mango played Fox and won, and Zain played Marth
      const filters: ReplayFilter[] = [
        {
          type: "player",
          connectCode: "MANG#0",
          characterIds: [FOX],
          mustBeWinner: true,
        },
        { type: "player", connectCode: "ZAIN#0", characterIds: [MARTH] },
      ];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      // Only game1 matches all conditions
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("game1.slp");
    });

    it("should filter games where mang0 played fox or falco and won against zain's marth or sheik", async () => {
      const folder = "/replays";
      const FOX = 2;
      const FALCO = 20;
      const MARTH = 13;
      const SHEIK = 18;
      const PEACH = 12;

      const { gameId: game1 } = await addGame(folder, "game1.slp");
      const { gameId: game2 } = await addGame(folder, "game2.slp");
      const { gameId: game3 } = await addGame(folder, "game3.slp");
      const { gameId: game4 } = await addGame(folder, "game4.slp");

      // Game 1: Mango Fox wins vs Zain Marth ✓
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game1, {
          port: 1,
          connect_code: "MANG#0",
          character_id: FOX,
          is_winner: 1,
        }),
      );
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game1, {
          port: 2,
          connect_code: "ZAIN#0",
          character_id: MARTH,
          is_winner: 0,
        }),
      );

      // Game 2: Mango Falco wins vs Zain Sheik ✓
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game2, {
          port: 1,
          connect_code: "MANG#0",
          character_id: FALCO,
          is_winner: 1,
        }),
      );
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game2, {
          port: 2,
          connect_code: "ZAIN#0",
          character_id: SHEIK,
          is_winner: 0,
        }),
      );

      // Game 3: Mango Fox wins vs Zain Peach (wrong character for Zain)
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game3, {
          port: 1,
          connect_code: "MANG#0",
          character_id: FOX,
          is_winner: 1,
        }),
      );
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game3, {
          port: 2,
          connect_code: "ZAIN#0",
          character_id: PEACH,
          is_winner: 0,
        }),
      );

      // Game 4: Mango Falco wins vs PPMD Marth (wrong opponent)
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game4, {
          port: 1,
          connect_code: "MANG#0",
          character_id: FALCO,
          is_winner: 1,
        }),
      );
      await PlayerRepository.insertPlayer(
        db,
        aMockPlayerWith(game4, {
          port: 2,
          connect_code: "PPMD#0",
          character_id: MARTH,
          is_winner: 0,
        }),
      );

      // Find games where Mango played Fox or Falco and won, and Zain played Marth or Sheik
      const filters: ReplayFilter[] = [
        {
          type: "player",
          connectCode: "MANG#0",
          characterIds: [FOX, FALCO],
          mustBeWinner: true,
        },
        { type: "player", connectCode: "ZAIN#0", characterIds: [MARTH, SHEIK] },
      ];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      // Games 1 and 2 match all conditions
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toEqual(expect.arrayContaining(["game1.slp", "game2.slp"]));
    });
  });

  describe("GameModeFilter", () => {
    it("should filter games by single mode", async () => {
      const folder = "/replays";

      await addGameWithMode(folder, "online.slp", 0x08); // ONLINE = 8
      await addGameWithMode(folder, "vs.slp", 0x02); // VS = 2
      await addGameWithMode(folder, "target.slp", 0x0f); // TARGET_TEST = 15

      const filters: ReplayFilter[] = [{ type: "gameMode", modes: [0x08] }];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("online.slp");
    });

    it("should filter games by multiple modes", async () => {
      const folder = "/replays";

      await addGameWithMode(folder, "online.slp", 0x08); // ONLINE
      await addGameWithMode(folder, "vs.slp", 0x02); // VS
      await addGameWithMode(folder, "target.slp", 0x0f); // TARGET_TEST
      await addGameWithMode(folder, "homerun.slp", 0x20); // HOME_RUN_CONTEST

      const filters: ReplayFilter[] = [
        { type: "gameMode", modes: [0x0f, 0x20] }, // Stadium modes
      ];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toEqual(expect.arrayContaining(["target.slp", "homerun.slp"]));
    });

    it("should return all games if modes array is empty", async () => {
      const folder = "/replays";

      await addGameWithMode(folder, "online.slp", 0x08);
      await addGameWithMode(folder, "vs.slp", 0x02);

      const filters: ReplayFilter[] = [{ type: "gameMode", modes: [] }];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      expect(results).toHaveLength(2);
    });
  });

  describe("Multiple filters (AND logic)", () => {
    it("should apply multiple filters with AND logic", async () => {
      const folder = "/replays";

      // Long online game with Mango winning
      const { gameId: game1 } = await addGameWithDurationAndMode(folder, "match.slp", 3600, 0x08);
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game1, { connect_code: "MANG#0", is_winner: 1 }));

      // Short online game with Mango winning
      const { gameId: game2 } = await addGameWithDurationAndMode(folder, "short.slp", 100, 0x08);
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game2, { connect_code: "MANG#0", is_winner: 1 }));

      // Long VS game with Mango winning
      const { gameId: game3 } = await addGameWithDurationAndMode(folder, "vs.slp", 3600, 0x02);
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game3, { connect_code: "MANG#0", is_winner: 1 }));

      // Long online game with Mango losing
      const { gameId: game4 } = await addGameWithDurationAndMode(folder, "loss.slp", 3600, 0x08);
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game4, { connect_code: "MANG#0", is_winner: 0 }));

      const filters: ReplayFilter[] = [
        { type: "duration", minFrames: 1800 },
        { type: "gameMode", modes: [0x08] },
        { type: "player", connectCode: "MANG#0", mustBeWinner: true },
      ];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      // Only game1 satisfies all conditions
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("match.slp");
    });

    it("should exclude stadium modes when game mode filter is applied", async () => {
      const folder = "/replays";

      // Short online game
      await addGameWithDurationAndMode(folder, "short_online.slp", 100, 0x08); // ONLINE

      // Long online game
      await addGameWithDurationAndMode(folder, "long_online.slp", 3600, 0x08); // ONLINE

      // Short stadium games (these normally bypass duration filtering)
      await addGameWithDurationAndMode(folder, "short_target.slp", 100, 0x0f); // TARGET_TEST
      await addGameWithDurationAndMode(folder, "short_homerun.slp", 100, 0x20); // HOME_RUN_CONTEST

      // Long stadium games
      await addGameWithDurationAndMode(folder, "long_target.slp", 3600, 0x0f); // TARGET_TEST

      const filters: ReplayFilter[] = [
        { type: "gameMode", modes: [0x08] }, // Only online games
        { type: "duration", minFrames: 1800 }, // At least 30 seconds
      ];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      // Only long_online.slp should match
      // Stadium games are excluded by game mode filter even though duration filter normally includes them
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("long_online.slp");
    });

    it("should find multiple specific players in the same game", async () => {
      const folder = "/replays";
      const { gameId: game1 } = await addGame(folder, "mang0_vs_armada.slp");
      const { gameId: game2 } = await addGame(folder, "mang0_vs_ppmd.slp");
      const { gameId: game3 } = await addGame(folder, "armada_vs_ppmd.slp");

      // Game 1: Mango vs Armada
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game1, { port: 1, connect_code: "MANG#0" }));
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game1, { port: 2, connect_code: "ARMA#0" }));

      // Game 2: Mango vs PPMD
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game2, { port: 1, connect_code: "MANG#0" }));
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game2, { port: 2, connect_code: "PPMD#0" }));

      // Game 3: Armada vs PPMD
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game3, { port: 1, connect_code: "ARMA#0" }));
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game3, { port: 2, connect_code: "PPMD#0" }));

      // Find games with both Mango AND Armada
      const filters: ReplayFilter[] = [
        { type: "player", connectCode: "MANG#0" },
        { type: "player", connectCode: "ARMA#0" },
      ];

      const results = await GameRepository.searchGames(db, folder, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      // Only game1 has both players
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("mang0_vs_armada.slp");
    });
  });

  describe("Folder filtering", () => {
    it("should search all folders when folder is null", async () => {
      // Add games to multiple folders
      const { gameId: game1 } = await addGame("/folder1", "game1.slp");
      const { gameId: game2 } = await addGame("/folder2", "game2.slp");
      const { gameId: game3 } = await addGame("/folder3", "game3.slp");

      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game1, { connect_code: "MANG#0" }));
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game2, { connect_code: "MANG#0" }));
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game3, { connect_code: "MANG#0" }));

      // Search across all folders
      const filters: ReplayFilter[] = [{ type: "player", connectCode: "MANG#0" }];
      const results = await GameRepository.searchGames(db, null, filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      // Should find games from all folders
      expect(results).toHaveLength(3);
      expect(results.map((r) => r.name)).toEqual(expect.arrayContaining(["game1.slp", "game2.slp", "game3.slp"]));
    });

    it("should search all folders when folder is empty string", async () => {
      // Add games to multiple folders
      const { gameId: game1 } = await addGame("/folder1", "game1.slp");
      const { gameId: game2 } = await addGame("/folder2", "game2.slp");

      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game1, { connect_code: "MANG#0" }));
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game2, { connect_code: "MANG#0" }));

      // Search across all folders with empty string
      const filters: ReplayFilter[] = [{ type: "player", connectCode: "MANG#0" }];
      const results = await GameRepository.searchGames(db, "", filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      // Should find games from all folders
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toEqual(expect.arrayContaining(["game1.slp", "game2.slp"]));
    });

    it("should respect folder filter when specified", async () => {
      // Add games to multiple folders
      const { gameId: game1 } = await addGame("/folder1", "game1.slp");
      const { gameId: game2 } = await addGame("/folder2", "game2.slp");

      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game1, { connect_code: "MANG#0" }));
      await PlayerRepository.insertPlayer(db, aMockPlayerWith(game2, { connect_code: "MANG#0" }));

      // Search only in folder1
      const filters: ReplayFilter[] = [{ type: "player", connectCode: "MANG#0" }];
      const results = await GameRepository.searchGames(db, "/folder1", filters, {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      // Should only find game from folder1
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("game1.slp");
      expect(results[0].folder).toBe("/folder1");
    });
  });

  describe("Pagination and ordering", () => {
    it("should order by start time descending", async () => {
      const folder = "/replays";

      await addGameWithStartTime(folder, "old.slp", "2023-01-01T00:00:00Z");
      await addGameWithStartTime(folder, "new.slp", "2023-12-31T00:00:00Z");
      await addGameWithStartTime(folder, "middle.slp", "2023-06-15T00:00:00Z");

      const results = await GameRepository.searchGames(db, folder, [], {
        limit: 10,
        orderBy: { field: "startTime", direction: "desc" },
      });

      expect(results.map((r) => r.name)).toEqual(["new.slp", "middle.slp", "old.slp"]);
    });

    it("should order by last frame ascending", async () => {
      const folder = "/replays";

      await addGameWithDuration(folder, "long.slp", 5000);
      await addGameWithDuration(folder, "short.slp", 1000);
      await addGameWithDuration(folder, "medium.slp", 3000);

      const results = await GameRepository.searchGames(db, folder, [], {
        limit: 10,
        orderBy: { field: "lastFrame", direction: "asc" },
      });

      expect(results.map((r) => r.name)).toEqual(["short.slp", "medium.slp", "long.slp"]);
    });

    it("should respect limit", async () => {
      const folder = "/replays";

      for (let i = 0; i < 10; i++) {
        await addGame(folder, `game${i}.slp`);
      }

      const results = await GameRepository.searchGames(db, folder, [], {
        limit: 5,
        orderBy: { field: "startTime", direction: "desc" },
      });

      expect(results).toHaveLength(5);
    });
  });

  // Helper functions
  async function addGame(folder: string, filename: string) {
    const { _id: fileId } = await FileRepository.insertFile(db, aMockFileWith({ folder, name: filename }));
    const { _id: gameId } = await GameRepository.insertGame(db, aMockGameWith(fileId));
    return { fileId, gameId };
  }

  async function addGameWithDuration(
    folder: string,
    filename: string,
    lastFrame: number | null,
    mode: number | null = 0x02,
  ) {
    const { _id: fileId } = await FileRepository.insertFile(db, aMockFileWith({ folder, name: filename }));
    const { _id: gameId } = await GameRepository.insertGame(db, aMockGameWith(fileId, { last_frame: lastFrame, mode }));
    return { fileId, gameId };
  }

  async function addGameWithMode(folder: string, filename: string, mode: number) {
    const { _id: fileId } = await FileRepository.insertFile(db, aMockFileWith({ folder, name: filename }));
    const { _id: gameId } = await GameRepository.insertGame(db, aMockGameWith(fileId, { mode }));
    return { fileId, gameId };
  }

  async function addGameWithDurationAndMode(folder: string, filename: string, lastFrame: number, mode: number) {
    const { _id: fileId } = await FileRepository.insertFile(db, aMockFileWith({ folder, name: filename }));
    const { _id: gameId } = await GameRepository.insertGame(db, aMockGameWith(fileId, { last_frame: lastFrame, mode }));
    return { fileId, gameId };
  }

  async function addGameWithStartTime(folder: string, filename: string, startTime: string) {
    const { _id: fileId } = await FileRepository.insertFile(db, aMockFileWith({ folder, name: filename }));
    const { _id: gameId } = await GameRepository.insertGame(db, aMockGameWith(fileId, { start_time: startTime }));
    return { fileId, gameId };
  }
});
