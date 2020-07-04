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

  let settings, stats;

  // Generate data here so that maybe we can add a loading state
  try {
    settings = gameToLoad.getSettings();
    stats = gameToLoad.getStats();
    gameToLoad.getMetadata();
  } catch {
    return null;
  }

  // This is jank and I shouldn't do this... but the rest of the app kind of relies on these being
  // set on the object which was legacy behavior. Preferably all of the places where this is used
  // would call the get functions or we would create an object that wraps the result.
  gameToLoad.settings = settings;
  gameToLoad.stats = stats;

  return gameToLoad;
}
