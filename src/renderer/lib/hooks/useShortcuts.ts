import { isMac } from "common/constants";
import mousetrap from "mousetrap";
import { useEffect } from "react";
import { useHistory } from "react-router-dom";

// Map Ctrl + 1 to be the first page, Ctrl + 2 to be the second page etc.
export const usePageNavigationShortcuts = (paths: string[]) => {
  const history = useHistory();

  // Only take the first 9 elements to map from 1-9
  // so we don't try to match Ctrl+10 etc.
  const handlers = paths.slice(0, 9).map((path, i) => {
    const oneIndexed = i + 1;
    return {
      keys: isMac ? `meta+${oneIndexed}` : `ctrl+${oneIndexed}`,
      handler: () => {
        history.push(path);
      },
    };
  });

  useEffect(() => {
    handlers.forEach((handler) => {
      mousetrap.bind(handler.keys, handler.handler);
    });

    return () => {
      handlers.forEach((handler) => {
        mousetrap.unbind(handler.keys);
      });
    };
  }, [paths]);
};
