import { Select as BaseSelect } from "@base-ui/react/select";
import { useMemo, useState } from "react";

import styles from "./distance_unit_select.module.css";

const DISTANCE_OPTIONS = [
  { value: 50, label: "50" },
  { value: 100, label: "100" },
  { value: 200, label: "200" },
  { value: 500, label: "500" },
] as const;

const UNIT_OPTIONS = [
  { value: "km", label: "km" },
  { value: "mi", label: "mi" },
] as const;

export type DistanceValue = (typeof DISTANCE_OPTIONS)[number]["value"];
export type UnitValue = (typeof UNIT_OPTIONS)[number]["value"];

interface DistanceUnitSelectProps {
  distance: DistanceValue;
  unit: UnitValue;
  onDistanceChange: (distance: DistanceValue) => void;
  onUnitChange: (unit: UnitValue) => void;
}

export function DistanceUnitSelect({ distance, unit, onDistanceChange, onUnitChange }: DistanceUnitSelectProps) {
  const [popupOpen, setPopupOpen] = useState(false);

  const displayValue = useMemo(() => {
    return `${distance} ${unit}`;
  }, [distance, unit]);

  return (
    <BaseSelect.Root open={popupOpen} onOpenChange={(open) => setPopupOpen(open)}>
      <BaseSelect.Trigger className={styles.trigger}>
        <BaseSelect.Value className={styles.value}>{displayValue}</BaseSelect.Value>
        <BaseSelect.Icon className={styles.icon}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 3.5L5 6.5L8 3.5" />
          </svg>
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner className={styles.positioner} sideOffset={4}>
          <BaseSelect.Popup className={styles.popup}>
            <div className={styles.section}>
              {DISTANCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`${styles.option} ${distance === opt.value ? styles.selected : ""}`}
                  onClick={() => onDistanceChange(opt.value)}
                >
                  <span className={styles.optionLabel}>{opt.label}</span>
                  {distance === opt.value && (
                    <span className={styles.check}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                        <path d="M8.5 2L3.5 7L1.5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className={styles.separator} />
            <div className={styles.section}>
              {UNIT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`${styles.option} ${unit === opt.value ? styles.selected : ""}`}
                  onClick={() => onUnitChange(opt.value)}
                >
                  <span className={styles.optionLabel}>{opt.label}</span>
                  {unit === opt.value && (
                    <span className={styles.check}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                        <path d="M8.5 2L3.5 7L1.5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
