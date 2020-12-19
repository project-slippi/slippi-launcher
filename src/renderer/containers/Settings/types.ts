export interface SettingItem {
  name: string;
  path: string;
  component: JSX.Element;
  icon?: JSX.Element;
}

export interface SettingSection {
  title?: string;
  items: SettingItem[];
}
