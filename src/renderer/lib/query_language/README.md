# Query Language Parser

This module provides a query language parser for the Slippi Launcher replay browser. It converts user-typed queries into structured filters that can be sent to the backend database.

## Features

- **Intuitive syntax**: Simple `key:value` format similar to GitHub/Gmail search
- **Quoted strings**: Support for names with spaces using quotes
- **Duration parsing**: Multiple formats (30s, 1m, 1800f)
- **Character/Stage matching**: Fuzzy matching for character and stage names
- **Player filters**: Search by connect code, tag, port, character
- **Negation**: Use `NOT` or `-` prefix to exclude results
- **Error handling**: Graceful error handling with detailed error messages

## Query Syntax

### Basic Search

```
mango                    # Search for "mango" in player names/tags/connect codes
"Liquid Hbox"           # Use quotes for names with spaces
```

### Duration Filters

```
minDuration:30s         # Minimum 30 seconds
maxDuration:5m          # Maximum 5 minutes
minDuration:1800f       # Minimum 1800 frames (explicit)
```

### Character Filters

```
char:fox                # Any player played Fox
char:fox,falco          # Any player played Fox OR Falco
p1:fox                  # Port 1 played Fox
p2:marth                # Port 2 played Marth
```

### Player Filters

```
code:MANG#0             # Player with connect code MANG#0
tag:Mango               # Player with tag "Mango"
winner:MANG#0           # MANG#0 won the game
port:1                  # Filter by port 1
```

### Combining Filters

```
mango stage:FD minDuration:30s          # Multiple filters
char:fox winner:MANG#0                  # Fox player who won
```

### Negation (Parsed but not yet applied to backend)

```
NOT char:puff           # Exclude Puff games (parsed but needs backend support)
-stage:FD               # Exclude FD games (parsed but needs backend support)
```

## Usage

### Basic Parsing

```typescript
import { parseQuery, convertToReplayFilters } from '@/lib/query_language';

const query = "mango char:fox minDuration:30s";
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
import { buildReplayFilters, useReplayFilter } from '@/lib/hooks/use_replay_filter';

const searchText = useReplayFilter((store) => store.searchText);
const hideShortGames = useReplayFilter((store) => store.hideShortGames);

// This now uses the query parser internally
const filters = buildReplayFilters(hideShortGames, searchText);
```

## Examples

### Example 1: Simple player search
```typescript
parseQuery("mango")
// Result: { searchText: ["mango"], filters: { textSearch: "mango" }, errors: [] }
```

### Example 2: Character and duration
```typescript
parseQuery("char:fox minDuration:1m")
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
parseQuery("mango char:fox,falco minDuration:30s winner:MANG#0")
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

### Example 4: Port-specific character
```typescript
parseQuery("p1:fox p2:marth")
// Result: {
//   searchText: [],
//   filters: {
//     playerFilters: [
//       { port: 1, characterIds: [2] },
//       { port: 2, characterIds: [9] }
//     ]
//   },
//   errors: []
// }
```

### Example 5: Error handling
```typescript
parseQuery("char:invalidchar")
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

## Architecture

The parser is organized into several modules:

- **types.ts**: TypeScript type definitions
- **filter_schema.ts**: Filter definitions and validation rules
- **tokenizer.ts**: Breaks query string into tokens
- **value_parser.ts**: Parses and validates values for different types
- **parser.ts**: Main parser logic that combines everything
- **index.ts**: Public API exports

## Current Limitations

1. **Stage filter**: Parsed but not yet implemented in backend (database doesn't have stage filtering)
2. **Negation**: Parsed but not yet applied to backend filters (requires backend support)
3. **Date filters**: Not yet implemented (after/before/date)
4. **Game mode filters**: Not yet implemented (ranked/unranked)
5. **Platform filter**: Not yet implemented (console/dolphin)

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
const { parseQuery } = require('@/lib/query_language');

// Test various queries
parseQuery("mango");
parseQuery("char:fox minDuration:30s");
parseQuery("winner:MANG#0 p1:fox");
```

## Contributing

When adding new filters:

1. Add the filter definition to `FILTER_SCHEMA` in `filter_schema.ts`
2. Add parsing logic in `applyFilter()` in `parser.ts`
3. Update `convertToReplayFilters()` if needed
4. Update this README with examples

