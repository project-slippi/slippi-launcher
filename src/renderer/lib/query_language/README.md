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
- **@me marker**: Special keyword for the current user's games
- **Error handling**: Graceful error handling with detailed error messages

## Query Syntax

For information on the query syntax, see [SYNTAX.md](SYNTAX.md).

## How it works

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

## Current Limitations

1. **Platform filter**: Not yet implemented (console/dolphin)

## Future Enhancements

- Auto-complete suggestions (planned for next phase)
- Syntax highlighting in search input
- Visual filter chips
- Query history
- Saved searches
- More advanced operators (OR, AND, parentheses)
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
