export const ReplayBrowserMessages = {
  filesDeleted: (count: number) => "{0, plural, one {# file} other {# files}} successfully deleted.",
  revealLocation: () => "Reveal location",
  currentFolder: () => "Current folder",
  noSlpFilesFound: () => "No SLP files found",
  clearFilter: () => "Clear filter",
  processedReplayCount: (count: number, total: number) =>
    "{0, number} of {1, plural, one {# replay} other {# replays}} processed.",
  totalReplayCount: (count: number) => "{0, plural, one {# replay} other {# replays}} found.",
  filteredReplayCount: (count: number) => "{0, plural, one {# replay} other {# replays}} filtered.",
  hiddenReplayCount: (count: number) => "{0, plural, one {# replay} other {# replays}} hidden.",
  errorReplayCount: (count: number) => "{0, plural, one {# replay} other {# replays}} had errors.",
  totalSize: (readableBytes: string) => "Total size: {0}",
};
