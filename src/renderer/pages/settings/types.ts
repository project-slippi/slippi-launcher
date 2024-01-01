export type SettingItem = {
  name: string;
  path: string;
  component: JSX.Element;
  icon?: JSX.Element;
};

export type SettingSection = {
  title?: string;
  items: SettingItem[];
};
