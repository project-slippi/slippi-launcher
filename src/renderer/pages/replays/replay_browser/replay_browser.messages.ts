export const ReplayBrowserMessages = {
  filesDeleted: (count: number) => "{0, plural, one {# file} other {# files}} successfully deleted.",
  revealLocation: () => "Reveal location",
  currentFolder: () => "Current folder",
  noSlpFilesFound: () => "No SLP files found",
  clearFilter: () => "Clear filter",
  totalFileCount: (count: number) => "{0, plural, one {# file} other {# files}} found.",
  filteredFileCount: (count: number) => "{0, plural, one {# file} other {# files}} filtered.",
  hiddenFileCount: (count: number) => "{0, plural, one {# file} other {# files}} hidden.",
  errorFileCount: (count: number) => "{0, plural, one {# file} other {# files}} had errors.",
  totalSize: (readableBytes: string) => "Total size: {0}",
};
