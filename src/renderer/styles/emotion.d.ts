import "@emotion/react";

import type { Theme as MatTheme } from "@material-ui/core/styles";

declare module "@emotion/react" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Theme extends MatTheme {}
}
