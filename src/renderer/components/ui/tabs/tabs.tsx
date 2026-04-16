import * as RadixTabs from "@radix-ui/react-tabs";

import styles from "./tabs.module.scss";

type Tab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

export const Tabs = ({ defaultTab, tabs }: { defaultTab?: string; tabs: Tab[] }) => (
  <RadixTabs.Root defaultValue={defaultTab}>
    <RadixTabs.List className={styles.List}>
      {tabs.map((tab) => (
        <RadixTabs.Trigger className={styles.Trigger} value={tab.id} key={tab.id}>
          {tab.label}
        </RadixTabs.Trigger>
      ))}
    </RadixTabs.List>
    {tabs.map((tab) => (
      <RadixTabs.Content className={styles.Content} value={tab.id} key={tab.id}>
        {tab.content}
      </RadixTabs.Content>
    ))}
  </RadixTabs.Root>
);
