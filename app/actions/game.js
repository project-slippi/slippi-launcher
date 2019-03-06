import _ from 'lodash';
import SlippiGame from 'slp-parser-js';

export const GAME_PROFILE_LOAD = 'GAME_PROFILE_LOAD';

export function gameProfileLoad(game) {
  return (dispatch) => {
    let gameToLoad = game;
    if (_.isString(game)) {
      // If string passed in, create SlippiGame
      gameToLoad = new SlippiGame(game);
    }

    // Load game information asynchronously
    dispatch({
      type: GAME_PROFILE_LOAD,
      game: gameToLoad,
    });
  };
}
