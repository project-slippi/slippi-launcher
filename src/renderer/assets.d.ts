declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  import type * as React from "react";

  // For `import { ReactComponent as Icon } from "./icon.svg"`
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }>;

  // For `import iconUrl from "./icon.svg"`
  const src: string;
  export default src;
}
