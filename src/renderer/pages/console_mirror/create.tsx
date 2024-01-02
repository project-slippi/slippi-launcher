import type React from "react";

import { ConsoleMirror } from "./console_mirror";

export function createConsoleMirrorPage(): { Page: React.ComponentType } {
  return { Page: ConsoleMirror };
}
