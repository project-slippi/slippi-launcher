import { Button } from "@base-ui/react";
import type { NewsItem } from "@common/types";
import { formatDistance } from "date-fns";
import React from "react";

import { getLocale } from "@/lib/time";
import type { SupportedLanguage } from "@/services/i18n/util";
import blueskyLogo from "@/styles/images/bluesky_logo.svg";
import githubLogo from "@/styles/images/github_inverted.svg";
import mediumLogo from "@/styles/images/medium_icon_white.svg";

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
    <Button
      className={styles.container}
      data-selected={selected || undefined}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={styles.row}>
        <div className={styles.iconContainer}>
          <SourceIcon source={item.source} />
        </div>
        <div>
          <div className={styles.title}>{extractTitle(item)}</div>
          <div className={styles.date}>{timeAgo}</div>
        </div>
      </div>
    </Button>
  );
});

const SourceIcon = ({ source }: { source: "medium" | "bluesky" | "github" }) => {
  switch (source) {
    case "medium":
      return <img src={mediumLogo} />;
    case "bluesky":
      return <img src={blueskyLogo} />;
    case "github":
      return <img src={githubLogo} />;
  }
};

const extractTitle = (item: NewsItem): string => {
  switch (item.source) {
    case "bluesky": {
      const text = item.body ?? "";
      const firstLine = text.slice(0, text.search(/\r?\n|$/));
      return [item.title, firstLine].filter(Boolean).join(": ");
    }
    default:
      return item.title;
  }
};
