import { render } from "react-dom";

import App from "./App";
import installServices from "./services/installServices";
import { ServiceProvider } from "./services/serviceContext";

const services = installServices();

render(
  <ServiceProvider value={services}>
    <App />
  </ServiceProvider>,
  document.getElementById("app"),
);
