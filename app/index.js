import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import 'react-virtualized/styles.css';
import Root from './containers/Root';
import { configureStore, history } from './store/configureStore';
import { initializeFirebase } from './domain/FirebaseAuthentication';
import './imports.global.css';
import './app.global.scss';

export const store = configureStore(); //eslint-disable-line

initializeFirebase();

render(
  <AppContainer>
    <Root store={store} history={history} />
  </AppContainer>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./containers/Root', () => {
    // eslint-disable-next-line global-require
    const NextRoot = require('./containers/Root').default;
    render(
      <AppContainer>
        <NextRoot store={store} history={history} />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}
