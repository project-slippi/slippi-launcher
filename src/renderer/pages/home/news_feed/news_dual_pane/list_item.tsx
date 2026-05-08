import type { NewsItem } from "@common/types";
import { formatDistance } from "date-fns";
import React from "react";

import { getLocale } from "@/lib/time";
import type { SupportedLanguage } from "@/services/i18n/util";

import styles from "./list_item.module.css";

export const ListItem = React.memo(function ListItem({
  item,
  selected,
  currentLanguage,
  onClick,
}: {
  item: NewsItem;
  selected: boolean;
  currentLanguage: SupportedLanguage;
  onClick: () => void;
}) {
  const dateFnsLocale = getLocale(currentLanguage);
  const timeAgo = formatDistance(new Date(item.publishedAt), new Date(), {
    addSuffix: true,
    locale: dateFnsLocale,
  });

  return (
    <div
      className={styles.row}
      data-selected={selected || undefined}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={styles.title}>{item.title}</div>
      <div className={styles.date}>{timeAgo}</div>
    </div>
  );
});
