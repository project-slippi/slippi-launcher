import { useEffect, useState } from "react";

/**
 * Hook to delay showing a loading indicator to avoid flashing on fast operations.
 *
 * @param isLoading - The actual loading state
 * @param delay - Milliseconds to wait before showing loading (default: 300ms)
 * @param minDisplay - Minimum milliseconds to display loading once shown (default: 500ms)
 * @returns Boolean indicating whether to show the loading indicator
 *
 * @example
 * const showLoading = useDelayedLoading(loading, 300, 500);
 * return showLoading ? <Spinner /> : <Content />;
 */
export function useDelayedLoading(isLoading: boolean, delay = 300, minDisplay = 500): boolean {
  const [showLoading, setShowLoading] = useState(false);
  const [shownAt, setShownAt] = useState<number | undefined>();

  useEffect(() => {
    if (isLoading && !showLoading) {
      // Start loading: wait `delay` ms before showing indicator
      const timer = setTimeout(() => {
        setShowLoading(true);
        setShownAt(Date.now());
      }, delay);

      return () => clearTimeout(timer);
    }

    if (!isLoading && showLoading && shownAt != null) {
      // Finished loading: ensure indicator was shown for at least `minDisplay` ms
      const elapsed = Date.now() - shownAt;
      const remaining = minDisplay - elapsed;

      if (remaining > 0) {
        const timer = setTimeout(() => {
          setShowLoading(false);
          setShownAt(undefined);
        }, remaining);

        return () => clearTimeout(timer);
      }

      // Cleanup immediately if minimum display time has passed
      setShowLoading(false);
      setShownAt(undefined);
    }

    return;
  }, [isLoading, showLoading, shownAt, delay, minDisplay]);

  return showLoading;
}
