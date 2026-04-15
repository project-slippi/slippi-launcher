/**
 * Query Language Types
 *
 * These types define the structure of parsed queries and errors.
 */

/**
 * Result of parsing a query string
 */
export type ParsedQuery = {
  /** Free text search terms (not part of filters) */
  searchText: string[];
  /** Structured filters extracted from the query */
  filters: QueryFilters;
  /** Any errors encountered during parsing */
  errors: QueryError[];
};

/**
 * Structured filters that can be converted to ReplayFilter[]
 */
export type QueryFilters = {
  // Duration filters
  minDuration?: number; // frames
  maxDuration?: number; // frames

  // Player filters (multiple player filters can be specified)
  playerFilters?: PlayerFilterSpec[];

  // Game mode filter
  gameModes?: number[];

  // Stage filter
  stageIds?: number[];

  // Free text search (when using searchText from query)
  textSearch?: string;

  // Negated filters (for NOT operator)
  excludeFilters?: QueryFilters;

  // Matchup filters (character vs character)
  // winner > loser syntax: "fox>marth" means fox beat marth
  matchups?: MatchupFilter[];
};

/**
 * Matchup filter for character vs character queries
 * Examples:
 * - { winnerCharIds: [2], loserCharIds: [9] } = Fox beat Marth
 * - { winnerCharIds: [2], loserCharIds: null } = Fox won (any opponent)
 * - { winnerCharIds: null, loserCharIds: [9] } = Marth lost (any opponent)
 */
export type MatchupFilter = {
  winnerCharIds?: number[]; // Character IDs of winner
  loserCharIds?: number[]; // Character IDs of loser
};

/**
 * Player filter specification
 * All specified fields are combined with AND logic - they must all match the same player
 */
export type PlayerFilterSpec = {
  connectCode?: string;
  displayName?: string;
  tag?: string;
  characterIds?: number[]; // Character IDs (OR logic - player played any of these)
  mustBeWinner?: boolean;
  // Exact matching flags (true = use exact match with =, false/undefined = fuzzy match with LIKE)
  tagExact?: boolean;
  displayNameExact?: boolean;
};

/**
 * Parsing error
 */
export type QueryError = {
  type: "INVALID_KEY" | "INVALID_VALUE" | "SYNTAX_ERROR";
  message: string;
  position?: number;
  key?: string;
};

/**
 * Token from tokenization phase
 */
export type Token =
  | { type: "WORD"; value: string; position: number }
  | {
      type: "FILTER";
      value: string;
      key: string;
      position: number;
      valueWasQuoted?: boolean;
    }
  | { type: "QUOTED"; value: string; position: number }
  | { type: "OPERATOR"; value: string; position: number }
  | {
      type: "MATCHUP";
      winner: string;
      loser: string;
      position: number;
      valueWasQuoted?: boolean;
    };

/**
 * Filter definition for schema
 */
export type FilterDefinition = {
  key: string;
  aliases?: string[];
  description: string;
  valueType: "string" | "number" | "boolean" | "enum" | "duration" | "date";
  enumValues?: Array<{
    value: string;
    label: string;
    id?: number;
    aliases: string[];
  }>;
  examples: string[];
  category: "player" | "game" | "date" | "platform";
};
