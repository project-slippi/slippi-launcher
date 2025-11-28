/**
 * Filter for game duration (in frames, 60 fps)
 *
 * Examples:
 * - { minFrames: 1800 } = at least 30 seconds
 * - { maxFrames: 18000 } = at most 5 minutes
 * - { minFrames: 1800, maxFrames: 18000 } = between 30s and 5min
 */
export type DurationFilter = {
  type: "duration";
  minFrames?: number;
  maxFrames?: number;
};

/**
 * Filter for player participation
 *
 * At least one of the identifier fields must be provided.
 * All specified fields are combined with AND logic - they must all match the same player.
 *
 * Examples:
 * - { connectCode: "MANG#0" } = games with a player who has connect code MANG#0
 * - { connectCode: "MANG#0", mustBeWinner: true } = games where MANG#0 won
 * - { userId: "abc123", displayName: "Mango" } = games where user abc123 has display name "Mango"
 */
export type PlayerFilter = {
  type: "player";
  // At least one identifier (OR logic if multiple provided)
  connectCode?: string;
  userId?: string;
  displayName?: string;
  tag?: string;
  // Optional win condition
  mustBeWinner?: boolean;
};

/**
 * Filter for game mode. Game mode values are from @slippi/slippi-js GameMode enum.
 *
 * Examples:
 * - { modes: [8] } = online games only
 * - { modes: [2, 8] } = vs or online
 * - { modes: [15, 32] } = stadium modes only
 */
export type GameModeFilter = {
  type: "gameMode";
  modes: number[];
};

export type ReplayFilter = DurationFilter | PlayerFilter | GameModeFilter;
