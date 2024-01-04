import React from "react";

export function lazyLoadReplaysPage() {
  const LazyPage = React.lazy(async () => {
    const { createReplaysPage } = await import("./create");
    const { Page } = createReplaysPage();
    return { default: Page };
  });

  const Page: React.ComponentType = (props) => (
    <React.Suspense fallback={null}>
      <LazyPage {...props} />
    </React.Suspense>
  );

  return { Page };
}
