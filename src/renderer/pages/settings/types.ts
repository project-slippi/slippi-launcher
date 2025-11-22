export type SettingItem = {
  name: () => string;
  path: string;
  component: JSX.Element;
  icon?: JSX.Element;
  hidden?: () => boolean;
};

export type SettingSection = {
  title?: () => string;
  items: SettingItem[];
};
