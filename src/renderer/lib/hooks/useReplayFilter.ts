import { extractAllPlayerNames, namesMatch } from "common/matchNames";
import { FileResult } from "common/replayBrowser";
import produce from "immer";
import create from "zustand";

export interface FilterOptions {
  searchText: string;
  sortByNewestFirst: boolean;
  hideShortGames: boolean;
}

const initialFilterOptions: FilterOptions = {
  searchText: "",
  sortByNewestFirst: true,
  hideShortGames: true,
};

type StoreState = {
  options: FilterOptions;
};

type StoreReducers = {
  setOptions: (options: Partial<FilterOptions>) => void;
};

const initialState: StoreState = {
  options: { ...initialFilterOptions },
};

const useReplayFilterStore = create<StoreState & StoreReducers>((set) => ({
  // Set the initial state
  ...initialState,

  setOptions: (options) => {
    set((store) =>
      produce(store, (draft) => {
        draft.options = Object.assign({}, draft.options, options);
      })
    );
  },
}));

const generateFilterFunction = (
  filterOptions: FilterOptions
): ((file: FileResult) => boolean) => (file) => {
  if (filterOptions.hideShortGames) {
    if (file.lastFrame !== null && file.lastFrame <= 30 * 60) {
      return false;
    }
  }

  const matchable = extractAllPlayerNames(file.settings, file.metadata);
  if (!filterOptions.searchText) {
    return true;
  } else if (matchable.length === 0) {
    return false;
  }
  return namesMatch([filterOptions.searchText], matchable);
};

const generateSortFunction = (
  filterOptions: FilterOptions
): ((a: FileResult, b: FileResult) => number) => (a, b) => {
  const aTime = a.startTime ? Date.parse(a.startTime) : 0;
  const bTime = b.startTime ? Date.parse(b.startTime) : 0;
  if (filterOptions.sortByNewestFirst) {
    return bTime - aTime;
  }
  return aTime - bTime;
};

export const useReplayFilter = () => {
  const filterOptions = useReplayFilterStore((store) => store.options);
  const setFilterOptions = useReplayFilterStore((store) => store.setOptions);
  const filterFunction = generateFilterFunction(filterOptions);
  const sortFunction = generateSortFunction(filterOptions);

  const sortAndFilterFiles = (files: FileResult[]) => {
    return files.filter(filterFunction).sort(sortFunction);
  };
  const clearFilter = () => {
    return setFilterOptions({ searchText: "", hideShortGames: false });
  };

  return {
    filterOptions,
    setFilterOptions,
    sortAndFilterFiles,
    clearFilter,
  };
};
