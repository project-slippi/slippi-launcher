import mousetrap from "mousetrap";
import type { RefObject } from "react";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const isMac = window.electron.common.isMac;

// Map Ctrl + 1 to be the first page, Ctrl + 2 to be the second page etc.
export const usePageNavigationShortcuts = (paths: string[]) => {
  const navigate = useNavigate();

  // Only take the first 9 elements to map from 1-9
  // so we don't try to match Ctrl+10 etc.
  const handlers = useMemo(
    () =>
      paths.slice(0, 9).map((path, i) => {
        const oneIndexed = i + 1;
        return {
          keys: isMac ? `meta+${oneIndexed}` : `ctrl+${oneIndexed}`,
          handler: () => {
            navigate(path);
          },
        };
      }),
    [navigate, paths],
  );

  useEffect(() => {
    handlers.forEach((handler) => {
      mousetrap.bind(handler.keys, handler.handler);
    });

    return () => {
      handlers.forEach((handler) => {
        mousetrap.unbind(handler.keys);
      });
    };
  }, [handlers, paths]);
};

// Add vim key bindings
export const usePageScrollingShortcuts = (ref: RefObject<HTMLDivElement>) => {
  const smallStep = 50;
  const bigStep = 300;

  const scrollBy = useCallback(
    (amount: number) => {
      if (!ref.current) {
        return;
      }

      ref.current.scrollBy({ top: amount });
    },
    [ref],
  );

  useEffect(() => {
    const handlers: Array<{
      keys: string | string[];
      handler: () => void;
    }> = [
      {
        keys: "j",
        handler: () => scrollBy(smallStep),
      },
      {
        keys: "k",
        handler: () => scrollBy(-smallStep),
      },
      {
        keys: "ctrl+d",
        handler: () => scrollBy(bigStep),
      },
      {
        keys: "ctrl+u",
        handler: () => scrollBy(-bigStep),
      },
    ];

    handlers.forEach((handler) => {
      mousetrap.bind(handler.keys, handler.handler);
    });

    return () => {
      handlers.forEach((handler) => {
        mousetrap.unbind(handler.keys);
      });
    };
  }, [ref, scrollBy]);
};
