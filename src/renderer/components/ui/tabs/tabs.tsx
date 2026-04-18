import { Tabs as BaseTabs } from "@base-ui/react/tabs";

import styles from "./tabs.module.scss";

type Tab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

export const Tabs = ({ defaultTab, tabs }: { defaultTab?: string; tabs: Tab[] }) => (
  <BaseTabs.Root defaultValue={defaultTab} className={styles.Root}>
    <BaseTabs.List className={styles.List}>
      {tabs.map((tab, i) => (
        <BaseTabs.Tab className={styles.Trigger} value={tab.id} key={i} data-label={tab.label}>
          {tab.label}
        </BaseTabs.Tab>
      ))}
    </BaseTabs.List>
    {tabs.map((tab, i) => (
      <BaseTabs.Panel className={styles.Content} value={tab.id} key={i}>
        {tab.content}
      </BaseTabs.Panel>
    ))}
  </BaseTabs.Root>
);
