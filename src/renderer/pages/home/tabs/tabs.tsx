import { Tabs as BaseTabs } from "@base-ui/react/tabs";

import styles from "./tabs.module.css";

type Tab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

type TabsProps = {
  defaultTab?: string;
  value?: string;
  onChange?: (tabId: string) => void;
  tabs: Tab[];
  highlightedTabIds?: string[];
};

export const Tabs = ({ defaultTab, value, onChange, tabs, highlightedTabIds }: TabsProps) => (
  <BaseTabs.Root defaultValue={defaultTab} value={value} onValueChange={onChange} className={styles.root}>
    <BaseTabs.List className={styles.list}>
      {tabs.map((tab, i) => (
        <BaseTabs.Tab className={styles.trigger} value={tab.id} key={i} data-label={tab.label}>
          <span className={styles.labelRow}>
            {highlightedTabIds?.includes(tab.id) && <span className={styles.dot} />}
            {tab.label}
          </span>
        </BaseTabs.Tab>
      ))}
    </BaseTabs.List>
    {tabs.map((tab, i) => (
      <BaseTabs.Panel className={styles.content} value={tab.id} key={i}>
        {tab.content}
      </BaseTabs.Panel>
    ))}
  </BaseTabs.Root>
);
