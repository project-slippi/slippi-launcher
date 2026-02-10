// Define additional aliases for characters and stages here

import { Character, Stage } from "@slippi/slippi-js";

export const STAGE_ALIASES = new Map<number, string[]>([
  [Stage.FOUNTAIN_OF_DREAMS, ["FoD", "Fountain"]],
  [Stage.POKEMON_STADIUM, ["PS", "Stadium"]],
  [Stage.YOSHIS_STORY, ["YS"]],
  [Stage.DREAMLAND, ["DL", "Dreamland"]],
  [Stage.BATTLEFIELD, ["BF"]],
  [Stage.FINAL_DESTINATION, ["FD"]],
]);

export const CHARACTER_ALIASES = new Map<number, string[]>([
  [Character.CAPTAIN_FALCON, ["CF"]],
  [Character.GAME_AND_WATCH, ["GnW"]],
  [Character.MEWTWO, ["M2"]],
  [Character.YOUNG_LINK, ["YL"]],
]);
