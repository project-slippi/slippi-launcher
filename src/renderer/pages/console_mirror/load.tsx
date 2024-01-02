import React from "react";

export function lazyLoadConsoleMirrorPage() {
  const LazyPage = React.lazy(async () => {
    const { createConsoleMirrorPage } = await import("./create");
    const { Page } = createConsoleMirrorPage();
    return { default: Page };
  });

  const Page: React.ComponentType = (props) => (
    <React.Suspense fallback={null}>
      <LazyPage {...props} />
    </React.Suspense>
  );

  return { Page };
}
