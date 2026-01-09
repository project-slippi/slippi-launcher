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
};

/**
 * Player filter specification
 * All specified fields are combined with AND logic - they must all match the same player
 */
export type PlayerFilterSpec = {
  connectCode?: string;
  displayName?: string;
  tag?: string;
  port?: number; // Port number (1-4)
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
export type Token = {
  type: "WORD" | "FILTER" | "QUOTED" | "OPERATOR";
  value: string;
  key?: string; // For FILTER tokens
  position: number;
  valueWasQuoted?: boolean; // For FILTER tokens - was the value quoted?
};

/**
 * Filter definition for schema
 */
export type FilterDefinition = {
  key: string;
  aliases?: string[];
  description: string;
  valueType: "string" | "number" | "boolean" | "enum" | "duration" | "date";
  enumValues?: Array<{ value: string; label: string; id?: number; alias?: string }>;
  examples: string[];
  category: "player" | "game" | "date" | "platform";
};
