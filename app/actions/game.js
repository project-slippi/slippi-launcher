export const GAME_LOAD_COMPLETE = 'GAME_LOAD_COMPLETE';

export function gameProfileLoad(game) {
  return async (dispatch) => {
    dispatch({
      type: GAME_LOAD_COMPLETE,
      payload: {
        game: game,
      },
    });
  };
}
