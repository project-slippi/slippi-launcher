import { useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useTabMemory } from "./use_tab_memory";

interface UseTabRouterOptions<T extends string> {
  contextKey: string;
  tabParam?: string;
  tabs: readonly T[];
  defaultTab: T;
  basePath: string;
}

function isIncluded<T extends string>(s: string | undefined, arr: readonly T[]): s is T {
  return s !== undefined && (arr as readonly string[]).includes(s);
}

export function useTabRouter<T extends string>({
  contextKey,
  tabParam = "tab",
  tabs,
  defaultTab,
  basePath,
}: UseTabRouterOptions<T>) {
  const navigate = useNavigate();
  const params = useParams();
  const setLastTab = useTabMemory((s) => s.setLastTab);
  const lastTab = useTabMemory((s) => s.lastTab[contextKey]);

  const urlTab = params[tabParam] as T | undefined;

  const currentTab: T = isIncluded(urlTab, tabs) ? urlTab : isIncluded(lastTab, tabs) ? lastTab : defaultTab;

  useEffect(() => {
    if (!isIncluded(urlTab, tabs)) {
      const target = isIncluded(lastTab, tabs) ? lastTab : defaultTab;
      navigate(`${basePath}/${target}`, { replace: true });
    }
  }, [urlTab, lastTab, defaultTab, basePath, navigate, tabs]);

  useEffect(() => {
    if (isIncluded(urlTab, tabs)) {
      setLastTab(contextKey, urlTab);
    }
  }, [urlTab, contextKey, setLastTab, tabs]);

  const navigateToTab = useCallback(
    (tab: T) => {
      setLastTab(contextKey, tab);
      navigate(`${basePath}/${tab}`);
    },
    [setLastTab, navigate, contextKey, basePath],
  );

  return { currentTab, navigateToTab };
}
