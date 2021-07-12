import log from "electron-log";
import React from "react";
import ReactDOM from "react-dom";

import App from "./App";

const rootEl = document.getElementById("app");

// use console.log as log.debug for easier access to debug logging
console.log = log.debug;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const render = (Component: any) =>
  // eslint-disable-next-line react/no-render-return-value
  ReactDOM.render(<Component />, rootEl);

render(App);
