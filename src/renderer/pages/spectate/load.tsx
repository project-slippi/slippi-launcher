import React from "react";

import type { AuthUser } from "@/services/auth/types";

import type { CreateSpectatePageArgs } from "./create";

export function lazyLoadSpectatePage(args: CreateSpectatePageArgs) {
  const LazyPage = React.lazy(async () => {
    const { createSpectatePage } = await import("./create");
    const { Page } = createSpectatePage(args);
    return { default: Page };
  });

  const Page: React.ComponentType<{ user: AuthUser }> = (props: { user: AuthUser }) => (
    <React.Suspense fallback={null}>
      <LazyPage {...props} />
    </React.Suspense>
  );

  return { Page };
}
