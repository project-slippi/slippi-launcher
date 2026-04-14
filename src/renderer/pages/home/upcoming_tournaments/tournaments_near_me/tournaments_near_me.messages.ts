export const TournamentsNearMeMessages = {
  title: () => "Tournaments Near Me",
  /**
   * A sentence describing the number of tournaments found nearby.
   * @param count The number of tournaments found. e.g. 10
   * @param city The approximate city the user is in. e.g. Shimomeguro
   * @param greaterRegion The greater region/state/prefecture the city is contained in. e.g. Tokyo
   */
  foundTournamentsNearby: (count: number, city: string, greaterRegion: string) =>
    "Found {0, plural, one {# tournament} other {# tournaments}} near {1}, {2}.",
  loading: () => "Searching for nearby tournaments...",
  error: (errorMessage: string) => `Failed to fetch tournaments. Error: {0}`,
  exploreEventsMap: () => "Show map of events",
  sortByDistance: () => "Sort by distance",
  sortByDate: () => "Sort by date",
  sortByEntrants: () => "Sort by entrants",
  inProgress: () => "In progress",
};
