import type { GameStartType, MetadataType } from "@slippi/slippi-js";
import get from "lodash/get";

export interface PlayerNames {
  name: string | null;
  code: string | null;
  tag: string | null;
}

export function extractPlayerNames(
  index: number,
  settings: GameStartType,
  metadata?: MetadataType | null,
): PlayerNames {
  const result: PlayerNames = {
    name: null,
    code: null,
    tag: null,
  };

  const player = settings.players.find((player) => player.playerIndex === index);
  result.tag = player?.nametag || null;
  result.name = player?.displayName || get(metadata, ["players", index, "names", "netplay"], null);
  result.code = player?.connectCode || get(metadata, ["players", index, "names", "code"], null);
  return result;
}

export function extractAllPlayerNames(settings: GameStartType, metadata?: MetadataType | null): string[] {
  const result: string[] = [];
  for (const player of settings.players) {
    const names = extractPlayerNames(player.playerIndex, settings, metadata);
    result.push(...Object.values(names).filter((n) => Boolean(n)));
  }
  return result;
}

export function namesMatch(lookingForNametags: string[], inGameTags: string[], fuzzyMatch = true): boolean {
  if (lookingForNametags.length === 0 || inGameTags.length === 0) {
    return false;
  }

  const match = inGameTags.find((name) => {
    // If we're not doing fuzzy matching just return the exact match
    if (!fuzzyMatch) {
      return lookingForNametags.includes(name);
    }

    // Replace the netplay names with underscores and coerce to lowercase
    // Smashladder internally represents spaces as underscores when writing SLP files
    const fuzzyNetplayName = name.toLowerCase();
    const matchedFuzzyTag = lookingForNametags.find((tag) => {
      const lowerSearch = tag.toLowerCase();
      const fuzzySearch = tag.split(" ").join("_").toLowerCase();
      return fuzzyNetplayName.startsWith(lowerSearch) || fuzzyNetplayName.startsWith(fuzzySearch);
    });
    return matchedFuzzyTag !== undefined;
  });

  return match !== undefined;
}
