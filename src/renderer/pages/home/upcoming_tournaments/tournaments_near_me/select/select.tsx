import { Select as BaseSelect } from "@base-ui/react/select";

import styles from "./select.module.css";

interface SelectOption<T> {
  label: string;
  value: T;
}

interface SelectProps<T> {
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
}

export function Select<T>({ value, options, onChange }: SelectProps<T>) {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <BaseSelect.Root
      items={options}
      value={selectedOption}
      onValueChange={(newValue) => {
        if (newValue && typeof newValue === "object" && "value" in newValue) {
          onChange((newValue as SelectOption<T>).value);
        }
      }}
    >
      <BaseSelect.Trigger className={styles.trigger}>
        <BaseSelect.Value className={styles.value}>
          {(val) => {
            const opt = val as SelectOption<T> | null;
            return opt?.label ?? "";
          }}
        </BaseSelect.Value>
        <BaseSelect.Icon className={styles.icon}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 3.5L5 6.5L8 3.5" />
          </svg>
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner className={styles.positioner} sideOffset={4}>
          <BaseSelect.Popup className={styles.popup}>
            <BaseSelect.List className={styles.list}>
              {options.map((opt) => (
                <BaseSelect.Item key={String(opt.value)} value={opt} className={styles.item}>
                  <BaseSelect.ItemText className={styles.itemText}>{opt.label}</BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator className={styles.itemIndicator}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                      <path d="M8.5 2L3.5 7L1.5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    </svg>
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
