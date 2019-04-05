import _ from 'lodash';
import SlippiGame from 'slp-parser-js';

export const GAME_LOAD_START = 'GAME_LOAD_START'
export const GAME_LOAD_COMPLETE = 'GAME_LOAD_COMPLETE';

export function gameProfileLoad(gameOrPath) {
  return async (dispatch) => {
    dispatch({
      type: GAME_LOAD_START,
      payload: {},
    });

    // Had to add this wait here otherwise the loading screen would not show
    const wait = ms => new Promise((resolve) => setTimeout(resolve, ms));
    await wait(10); // eslint-disable-line

    // Load game information asynchronously
    const game = await loadGame(gameOrPath);

    dispatch({
      type: GAME_LOAD_COMPLETE,
      payload: {
        game: game,
      },
    });
  };
}

async function loadGame(gameOrPath) {
  let gameToLoad = gameOrPath;
  if (_.isString(gameOrPath)) {
    // If string passed in, create SlippiGame
    gameToLoad = new SlippiGame(gameOrPath);
  }

  // Generate data here so that maybe we can add a loading state
  gameToLoad.getSettings();
  gameToLoad.getStats();
  gameToLoad.getMetadata();

  return gameToLoad;
}
