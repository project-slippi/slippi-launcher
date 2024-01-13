import React from "react";

export function lazyLoadQuickStartPage() {
  const LazyPage = React.lazy(async () => {
    const { createQuickStartPage } = await import("./create");
    const { Page } = createQuickStartPage();
    return { default: Page };
  });

  const Page: React.ComponentType = (props) => (
    <React.Suspense fallback={null}>
      <LazyPage {...props} />
    </React.Suspense>
  );

  return { Page };
}
