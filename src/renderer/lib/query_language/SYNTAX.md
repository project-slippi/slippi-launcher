## Query Language Syntax

### Basic Search

```
mango                   # Search for "mango" in player names/tags/connect codes
"Liquid Hbox"           # Use quotes for names with spaces or to find exact non-fuzzy matches
```


### Character Filters

```
char:fox                # Any player played Fox
char:fox,falco          # Any player played Fox OR Falco
```

### Stage Filters

```
stage:battlefield      # Games played on Battlefield
stage:FD               # Games played on Final Destination
stage:pokemon_stadium  # Games played on Pokémon Stadium
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

### Special Markers

```
@me                     # The current user's games
-@me                    # Exclude the current user's games
winner:@me              # Games that the current user won
loser:@me               # Games that the current user lost
```

The `@me` marker is a special keyword that refers to the currently logged-in user's Firebase user ID. It can be used with player filters to quickly find games involving yourself. Use `-@me` to exclude your games. The marker is case-insensitive (`@ME`, `@Me`, `@me` all work).


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
fox>marth                               # Fox beat Marth
puff> stage:FD                          # Puff won on Final Destination
duration:>30s duration:<4m              # Games between 30s and 4m
```

### Negation

```
-stage:FD               # Exclude FD games
-char:puff              # Exclude Puff games
-winner:MANG#0          # Exclude games where MANG#0 won
-loser:MANG#0           # Exclude games where MANG#0 lost
```
