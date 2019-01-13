import { combineReducers } from 'redux';

import { connectRouter } from 'connected-react-router';
import fileLoader from './fileLoader';
import settings from './settings';
import console from './console';
import game from './game';
import errors from './error';
import notifs from './notifs';

export default function createRootReducer(history) {
  return combineReducers({
    router: connectRouter(history),
    fileLoader: fileLoader,
    settings: settings,
    console: console,
    game: game,
    errors: errors,
    notifs: notifs,
  });
}
