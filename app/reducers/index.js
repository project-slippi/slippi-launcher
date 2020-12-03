import { combineReducers } from 'redux';

import { connectRouter } from 'connected-react-router';
import fileLoader from './fileLoader';
import settings from './settings';
import console from './console';
import game from './game';
import player from './player';
import auth from './auth';
import errors from './error';
import notifs from './notifs';
import broadcast from './broadcast';

export default function createRootReducer(history) {
  return combineReducers({
    router: connectRouter(history),
    fileLoader: fileLoader,
    settings: settings,
    console: console,
    game: game,
    player: player,
    auth: auth,
    errors: errors,
    notifs: notifs,
    broadcast: broadcast,
  });
}
