import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import HomePage from './containers/HomePage';
import FileLoaderPage from './containers/FileLoaderPage';
import GameProfilePage from './containers/GameProfilePage';
import SettingsPage from './containers/SettingsPage';
import ConsolePage from './containers/ConsolePage';
import BroadcastPage from './containers/BroadcastPage';

export default () => (
  <App>
    <Switch>
      <Route path="/files" component={FileLoaderPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/game" component={GameProfilePage} />
      <Route path="/broadcast" component={BroadcastPage} />
      <Route path="/console" component={ConsolePage} />
      <Route path="/" component={HomePage} />
    </Switch>
  </App>
);
