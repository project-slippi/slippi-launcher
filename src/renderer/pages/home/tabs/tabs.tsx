import { useCallback } from "react";

import styles from "./tabs.module.css";

type Tab = {
  id: string;
  label: string;
};

type TabsProps = {
  value?: string | null;
  onChange?: (tabId: string) => void;
  tabs: Tab[];
  highlightedTabIds?: string[];
};

const focusAdjacent = (element: HTMLElement, dir: -1 | 1) => {
  const list = element.closest<HTMLElement>('[role="tablist"]');
  if (!list) {
    return;
  }
  const tabs = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]'));
  const next = (tabs.indexOf(element) + dir + tabs.length) % tabs.length;
  tabs[next]?.focus();
};

export const Tabs = ({ value, onChange, tabs, highlightedTabIds }: TabsProps) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      focusAdjacent(e.currentTarget, e.key === "ArrowLeft" ? -1 : 1);
    }
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.list} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={styles.trigger}
            role="tab"
            aria-selected={tab.id === value}
            data-active={tab.id === value ? "true" : undefined}
            onClick={() => onChange?.(tab.id)}
            onKeyDown={handleKeyDown}
          >
            <span className={styles.labelRow}>
              {highlightedTabIds?.includes(tab.id) && <span className={styles.dot} />}
              <span className={styles.label} data-label={tab.label}>
                {tab.label}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
