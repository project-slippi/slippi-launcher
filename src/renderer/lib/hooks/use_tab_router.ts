import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useTabMemory } from "./use_tab_memory";

interface UseTabRouterOptions<T extends string> {
  contextKey: string;
  tabParam?: string;
  tabs: readonly T[];
  defaultTab: T;
  basePath: string;
  extraParams?: Partial<Record<T, string[]>>;
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
  extraParams,
}: UseTabRouterOptions<T>) {
  const navigate = useNavigate();
  const params = useParams();
  const setLastTab = useTabMemory((s) => s.setLastTab);
  const setTabParam = useTabMemory((s) => s.setTabParam);
  const lastTab = useTabMemory((s) => s.lastTab[contextKey]);

  const urlTab = params[tabParam] as T | undefined;

  const currentTab: T = isIncluded(urlTab, tabs) ? urlTab : isIncluded(lastTab, tabs) ? lastTab : defaultTab;

  const tabState = useTabMemory((s) => (extraParams ? s.tabState[`${contextKey}:${currentTab}`] : undefined));

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

  useEffect(() => {
    if (!extraParams || !isIncluded(urlTab, tabs)) {
      return;
    }
    const paramNames = extraParams[urlTab];
    if (!paramNames) {
      return;
    }
    for (const paramName of paramNames) {
      const urlValue = params[paramName] as string | undefined;
      if (urlValue) {
        setTabParam(contextKey, urlTab, paramName, urlValue);
      }
    }
  }, [urlTab, extraParams, params, contextKey, setTabParam, tabs]);

  const extraParamValues = useMemo(() => {
    if (!extraParams) {
      return {};
    }
    const paramNames = extraParams[currentTab];
    if (!paramNames) {
      return {};
    }
    const result: Record<string, string | null> = {};
    for (const name of paramNames) {
      result[name] = (params[name] as string | undefined) ?? tabState?.[name] ?? null;
    }
    return result;
  }, [extraParams, currentTab, params, tabState]);

  const navigateToTab = useCallback(
    (tab: T) => {
      setLastTab(contextKey, tab);
      navigate(`${basePath}/${tab}`);
    },
    [setLastTab, navigate, contextKey, basePath],
  );

  return { currentTab, navigateToTab, extraParamValues };
}
