import { clsx } from "clsx";
import React from "react";
import { create } from "zustand";

import styles from "./infinite_scroll_container.module.css";

const DEFAULT_LOOK_AHEAD = "200px";

// Store for persisting scroll positions across component unmounts
const useScrollPositionStore = create<{
  positions: Map<string, number>;
  setPosition: (key: string, offset: number) => void;
  getPosition: (key: string) => number;
}>((set, get) => ({
  positions: new Map(),
  setPosition: (key: string, offset: number) =>
    set((state) => {
      const newPositions = new Map(state.positions);
      newPositions.set(key, offset);
      return { positions: newPositions };
    }),
  getPosition: (key: string) => get().positions.get(key) ?? 0,
}));

export interface InfiniteScrollContainerProps {
  className?: string;
  children: React.ReactNode;
  onLoadMore: () => void;
  hasMore: boolean;

  // Optional scroll position persistence
  persistScrollId?: string;

  // Optional reset trigger - when this changes, scroll resets to top
  resetKey?: string | number;

  // Performance tuning
  lookAhead?: string; // When to load content ahead of viewport

  // Loading state - if provided, scroll restoration will wait for loading to complete
  isLoading?: boolean;
}

/**
 * A reusable infinite scroll container that uses IntersectionObserver for
 * performant loading of additional content as the user scrolls.
 *
 * Features:
 * - Intersection Observer-based (more performant than scroll event handlers)
 * - Optional scroll position persistence across unmounts
 * - Automatic scroll reset when resetKey changes
 * - RequestAnimationFrame for smooth loading
 * - Passive scroll listeners for better performance
 */
export const InfiniteScrollContainer = React.memo(function InfiniteScrollContainer({
  className,
  children,
  onLoadMore,
  hasMore,
  persistScrollId,
  resetKey,
  lookAhead = DEFAULT_LOOK_AHEAD,
  isLoading = false,
}: InfiniteScrollContainerProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const loadMoreSentinelRef = React.useRef<HTMLDivElement>(null);
  const lastResetKeyRef = React.useRef(resetKey);
  const currentScrollOffsetRef = React.useRef(0);

  // Get initial scroll position from store (only if persistence is enabled)
  const initialScrollOffset = React.useRef(
    persistScrollId ? useScrollPositionStore.getState().getPosition(persistScrollId) : 0,
  );

  // Track if we're still trying to restore the scroll position
  const [isRestoringScroll, setIsRestoringScroll] = React.useState(initialScrollOffset.current > 0);
  const loadMoreCalledRef = React.useRef(false);

  // Restore scroll position by loading content until we have enough
  // Use LayoutEffect so it runs synchronously after DOM updates (when children change)
  React.useLayoutEffect(() => {
    if (!persistScrollId || !isRestoringScroll) {
      return;
    }

    const scrollElement = scrollContainerRef.current;
    if (!scrollElement) {
      return;
    }

    const targetScroll = initialScrollOffset.current;
    const currentScrollHeight = scrollElement.scrollHeight;
    const clientHeight = scrollElement.clientHeight;
    const maxScrollableHeight = currentScrollHeight - clientHeight;

    // Check if we have enough content to reach the target
    if (maxScrollableHeight >= targetScroll) {
      // We have enough content, scroll to the target position
      scrollElement.scrollTop = targetScroll;
      currentScrollOffsetRef.current = targetScroll;
      // Use requestAnimationFrame to ensure scroll happens before we show content
      requestAnimationFrame(() => {
        setIsRestoringScroll(false);
      });
      loadMoreCalledRef.current = false;
    } else if (hasMore && !loadMoreCalledRef.current && !isLoading) {
      // Not enough content yet, load more
      // Only call if we're not currently loading (prevents guards in onLoadMore from blocking)
      loadMoreCalledRef.current = true;
      onLoadMore();
    } else if (!hasMore) {
      // No more content to load, scroll as far as we can
      scrollElement.scrollTop = maxScrollableHeight;
      currentScrollOffsetRef.current = maxScrollableHeight;
      requestAnimationFrame(() => {
        setIsRestoringScroll(false);
      });
      loadMoreCalledRef.current = false;
    }
  });

  // Reset the load more flag when:
  // 1. Content actually changes (scroll height increases), OR
  // 2. Loading completes (isLoading changes from true to false)
  const previousScrollHeightRef = React.useRef(0);
  const previousIsLoadingRef = React.useRef(isLoading);
  React.useLayoutEffect(() => {
    if (isRestoringScroll && scrollContainerRef.current) {
      const currentHeight = scrollContainerRef.current.scrollHeight;
      const wasLoading = previousIsLoadingRef.current;
      const isNowNotLoading = wasLoading && !isLoading;

      if (currentHeight > previousScrollHeightRef.current || isNowNotLoading) {
        // Content was added or loading completed, allow another load more call
        loadMoreCalledRef.current = false;
        previousScrollHeightRef.current = currentHeight;
      }

      previousIsLoadingRef.current = isLoading;
    }
  });

  // Reset scroll position when resetKey changes
  React.useEffect(() => {
    if (resetKey !== lastResetKeyRef.current) {
      lastResetKeyRef.current = resetKey;
      currentScrollOffsetRef.current = 0;
      setIsRestoringScroll(false); // Cancel any pending restoration
      loadMoreCalledRef.current = false;
      previousScrollHeightRef.current = 0;
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  }, [resetKey]);

  // Use Intersection Observer for performant infinite scroll
  React.useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || !hasMore) {
      return;
    }

    let rafId: number | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        // When the sentinel becomes visible, load more
        if (entries[0].isIntersecting) {
          // Defer loading to next frame to avoid blocking scroll
          rafId = requestAnimationFrame(() => {
            onLoadMore();
            rafId = null;
          });
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: lookAhead, // Load well ahead of viewport for smooth momentum scrolling
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      if (rafId != null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [onLoadMore, hasMore, lookAhead]);

  // Track scroll position and save on unmount (if persistence is enabled)
  React.useEffect(() => {
    if (!persistScrollId) {
      return;
    }

    const scrollElement = scrollContainerRef.current;
    if (!scrollElement) {
      return;
    }

    const handleScroll = () => {
      currentScrollOffsetRef.current = scrollElement.scrollTop;
    };

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
      useScrollPositionStore.getState().setPosition(persistScrollId, currentScrollOffsetRef.current);
    };
  }, [persistScrollId]);

  return (
    <div
      ref={scrollContainerRef}
      className={clsx(styles.base, className)}
      style={{
        opacity: isRestoringScroll ? 0 : 1,
      }}
    >
      {children}
      {/* Sentinel element for intersection observer - only render if there are more items */}
      {hasMore && <div ref={loadMoreSentinelRef} style={{ height: "1px" }} />}
    </div>
  );
});
