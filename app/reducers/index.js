import { combineReducers } from 'redux';

import fileLoader from './fileLoader';
import settings from './settings';
import console from './console';
import game from './game';
import errors from './error';
import notifs from './notifs';

import { connectRouter } from 'connected-react-router';

export default function createRootReducer(history: History) {
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
