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

export const useReplayFilter = create<StoreState & StoreReducers>((set) => ({
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
