import { InitialStateType } from "./types";
import { Action, ActionPayload } from "./actions";

type ActionMap<M extends { [index: string]: any }> = {
  [Key in keyof M]: M[Key] extends undefined
    ? {
        type: Key;
      }
    : {
        type: Key;
        payload: M[Key];
      };
};

export type ReducerActions = ActionMap<ActionPayload>[keyof ActionMap<ActionPayload>];

export const reducer = (state: InitialStateType, action: ReducerActions) => {
  switch (action.type) {
    case Action.SET_USER: {
      const { user } = action.payload;
      return {
        ...state,
        user,
      };
    }
    case Action.SET_INITIALIZED: {
      return {
        ...state,
        initialized: true,
      };
    }
    default:
      return state;
  }
};
