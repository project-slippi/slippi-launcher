# Query Language Parser

This module provides a query language parser for the Slippi Launcher replay browser. It converts user-typed queries into structured filters that can be sent to the backend database.

## Features

- **Intuitive syntax**: Simple `key:value` format similar to GitHub/Gmail search
- **Quoted strings**: Support for names with spaces using quotes
- **Duration parsing**: Multiple formats (30s, 1m, 1800f)
- **Character/Stage matching**: Fuzzy matching for character and stage names
- **Player filters**: Search by connect code, tag, character
- **Matchup filters**: Search by character vs character (winner > loser syntax)
- **Date filters**: Search by game date with partial date support (YYYY, YYYY-MM, YYYY-MM-DD)
- **Negation**: Use `-` prefix to exclude results
- **Error handling**: Graceful error handling with detailed error messages

## Query Syntax

### Basic Search

```
mango                   # Search for "mango" in player names/tags/connect codes
"Liquid Hbox"           # Use quotes for names with spaces
```

### Duration Filters

```
duration:>30s               # Games longer than 30 seconds
duration:<5m                # Games less than 5 minutes
duration:30s                # Games at least 30 seconds (default to min)
duration:>30s duration:<4m  # Games between 30 seconds and 4 minutes
duration:1800f              # Minimum 1800 frames (explicit)

# Combined units (must be in descending order: h > m > s > f)
duration:1m30s              # 1 minute 30 seconds
duration:>1m30s             # Greater than 1 minute 30 seconds
duration:<2h30m             # Less than 2 hours 30 minutes
duration:1h30m15s           # 1 hour 30 minutes 15 seconds
```

### Character Filters

```
char:fox                # Any player played Fox
char:fox,falco          # Any player played Fox OR Falco
```

### Stage Filters

```
stage: battlefield      # Games played on Battlefield
stage: FD               # Games played on Final Destination
stage: pokemon_stadium  # Games played on Pokémon Stadium
```

### Player Filters

```
code:MANG#0             # Player with connect code MANG#0
tag:Mango               # Player with tag "Mango"
winner:MANG#0           # MANG#0 won the game
```

### Matchup Filters

```
fox>marth              # Fox beat Marth
fox>                   # Fox won (any opponent)
>marth                 # Marth lost (any opponent)
puff>falco stage:FD    # Puff beat Falco on Final Destination
```

### Date Filters

```
date:2026                    # Games from 2026 (entire year)
date:2025-02                 # Games from February 2025 (entire month)
date:2024-01-15              # Games from January 15, 2024 (entire day)
date:>2025-02                # Games after February 2025
date:<2025-06                # Games before June 2025
date:>=2024-01-01            # Games on or after January 1, 2024
date:<=2024-12-31            # Games on or before December 31, 2024
date:>2025-02 date:<2025-06  # Games between February and June 2025 (exclusive)
-date:2024-01-15             # Exclude games from January 15, 2024
```

Date filters support three formats:

- **Year**: `date:2026` matches all games from 2026
- **Year-Month**: `date:2025-02` matches all games from February 2025
- **Year-Month-Day**: `date:2024-01-15` matches all games from January 15, 2024

Without an operator, the date matches the entire period. Operators allow range queries.

### Game Type Filters

```
is:ranked               # Ranked games only
is:unranked             # Unranked games only
is:doubles              # Teams/doubles games only
is:singles              # Alias for -is:doubles
is:teams                # Alias for is:doubles
```

Note: The `-` prefix negates the filter, so `-is:ranked` means "not ranked" (unranked).

### Combining Filters

```
mango stage:FD duration:>30s            # Multiple filters
char:fox winner:MANG#0                  # Fox player who won
fox>marth                               # Fox beat Marth
puff> stage:FD                          # Puff won on Final Destination
duration:>30s duration:<4m              # Games between 30 seconds and 4 minutes
```

### Negation

```
- stage:FD               # Exclude FD games
- char:puff              # Exclude Puff games
- winner:MANG#0          # Exclude games where MANG#0 won
- loser:MANG#0           # Exclude games where MANG#0 lost
```

## Usage

### Basic Parsing

```typescript
import { parseQuery, convertToReplayFilters } from "@/lib/query_language";

const query = "mango char:fox duration:>30s";
const parsed = parseQuery(query);

console.log(parsed);
// {
//   searchText: ["mango"],
//   filters: {
//     textSearch: "mango",
//     minDuration: 1800,
//     playerFilters: [{ characterIds: [2] }]
//   },
//   errors: []
// }

// Convert to backend format
const replayFilters = convertToReplayFilters(parsed.filters);
// [
//   { type: "textSearch", query: "mango" },
//   { type: "duration", minFrames: 1800 },
//   { type: "player", characterIds: [2] }
// ]
```

### Integration with Replay Filter Hook

The query parser is already integrated with `useReplayFilter` hook via the `buildReplayFilters` function:

```typescript
import {
  buildReplayFilters,
  useReplayFilter,
} from "@/lib/hooks/use_replay_filter";

const searchText = useReplayFilter((store) => store.searchText);
const hideShortGames = useReplayFilter((store) => store.hideShortGames);

// This now uses the query parser internally
const filters = buildReplayFilters(hideShortGames, searchText);
```

## Examples

### Example 1: Simple player search

```typescript
parseQuery("mango");
// Result: { searchText: ["mango"], filters: { textSearch: "mango" }, errors: [] }
```

### Example 2: Character and duration

```typescript
parseQuery("char:fox duration:>1m");
// Result: {
//   searchText: [],
//   filters: {
//     minDuration: 3600,
//     playerFilters: [{ characterIds: [2] }]
//   },
//   errors: []
// }
```

### Example 3: Complex query

```typescript
parseQuery("mango char:fox,falco duration:>30s winner:MANG#0");
// Result: {
//   searchText: ["mango"],
//   filters: {
//     textSearch: "mango",
//     minDuration: 1800,
//     playerFilters: [
//       { characterIds: [2, 20] },
//       { connectCode: "MANG#0", mustBeWinner: true }
//     ]
//   },
//   errors: []
// }
```

### Example 4: Error handling

```typescript
parseQuery("char:invalidchar");
// Result: {
//   searchText: [],
//   filters: {},
//   errors: [{
//     type: "INVALID_VALUE",
//     message: 'Invalid value for char: Invalid value: "invalidchar". Expected one of: ...',
//     key: "char"
//   }]
// }
```

### Example 5: Matchup filters

```typescript
parseQuery("fox>marth");
// Result: {
//   searchText: [],
//   filters: {
//     matchups: [{ winnerCharIds: [2], loserCharIds: [9] }]
//   },
//   errors: []
// }

parseQuery("fox> stage:FD");
// Result: {
//   searchText: [],
//   filters: {
//     matchups: [{ winnerCharIds: [2] }],
//     stageIds: [32]
//   },
//   errors: []
// }

parseQuery(">marth");
// Result: {
//   searchText: [],
//   filters: {
//     matchups: [{ loserCharIds: [9] }]
//   },
//   errors: []
// }
```

### Example 6: Stage filtering

```typescript
parseQuery("stage:battlefield");
// Result: {
//   searchText: [],
//   filters: { stageIds: [31] },
//   errors: []
// }

parseQuery("stage:final_destination");
// Result: {
//   searchText: [],
//   filters: { stageIds: [32] },
//   errors: []
// }
```

## Architecture

The parser is organized into several modules:

- **types.ts**: TypeScript type definitions
- **filter_schema.ts**: Filter definitions and validation rules
- **tokenizer.ts**: Breaks query string into tokens
- **value_parser.ts**: Parses and validates values for different types
- **parser.ts**: Main parser logic that combines everything
- **index.ts**: Public API exports

## Current Limitations

1. **Platform filter**: Not yet implemented (console/dolphin)

## Future Enhancements

- Auto-complete suggestions (planned for next phase)
- Syntax highlighting in search input
- Visual filter chips
- Query history
- Saved searches
- More advanced operators (OR, AND, parentheses)
- Date range filters
- Platform filters

## Testing

You can test the parser in the browser console:

```javascript
const { parseQuery } = require("@/lib/query_language");

// Test various queries
parseQuery("mango");
parseQuery("char:fox duration:>30s");
parseQuery("winner:MANG#0 char:fox");
```

## Contributing

When adding new filters:

1. Add the filter definition to `FILTER_SCHEMA` in `filter_schema.ts`
2. Add parsing logic in `applyFilter()` in `parser.ts`
3. Update `convertToReplayFilters()` if needed
4. Update this README with examples
