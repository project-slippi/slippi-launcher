import React, { createContext, Dispatch, useReducer } from "react";

import { reducer, ReducerActions } from "./reducers";
import { InitialStateType } from "./types";

const initialState: InitialStateType = {
  initialized: false,
  user: null,
};

const AppContext = createContext<{
  state: InitialStateType;
  dispatch: Dispatch<ReducerActions>;
}>({
  state: initialState,
  dispatch: () => null,
});

const mainReducer = (state: InitialStateType, action: ReducerActions) =>
  reducer(state, action);

const AppProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(mainReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export { AppProvider, AppContext };
