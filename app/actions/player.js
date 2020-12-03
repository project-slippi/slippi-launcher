export const PLAYER_GAMES_LOAD = 'PLAYER_GAMES_LOAD';
export const ADD_FILTER = 'ADD_FILTER';
export const REMOVE_FILTER = 'REMOVE_FILTER';

export function playerGamesLoad(games, player) {
  return async (dispatch) => {
    dispatch({
      type: PLAYER_GAMES_LOAD,
      payload: {
        games: games,
        player: player,
      },
    });
  };
}

export function gamesFilterAdd(filter) {
  return async (dispatch) => {
    dispatch({
      type: ADD_FILTER,
      payload: {
        filter: filter,
      },
    });
  };
}

export function gamesFilterRemove(filter) {
  return async (dispatch) => {
    dispatch({
      type: REMOVE_FILTER,
      payload: {
        filter: filter,
      },
    });
  };
}
