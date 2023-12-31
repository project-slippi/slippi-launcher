import React from "react";

export function lazyLoadSettingsPage() {
  const LazyPage = React.lazy(async () => {
    const { createSettingsPage } = await import("./create");
    const { Page } = createSettingsPage();
    return { default: Page };
  });

  const Page: React.ComponentType = (props) => (
    <React.Suspense fallback={null}>
      <LazyPage {...props} />
    </React.Suspense>
  );

  return { Page };
}
