import mousetrap from "mousetrap";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const isMac = window.electron.bootstrap.isMac;

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
