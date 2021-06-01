import "@emotion/react";

import { Theme as MatTheme } from "@material-ui/core/styles";

declare module "@emotion/react" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Theme extends MatTheme {}
}
