import type { NewsItem } from "@common/types";
import { format } from "date-fns";
import React from "react";

import { useAppStore } from "@/lib/hooks/use_app_store";
import { getLocale } from "@/lib/time";
import type { SupportedLanguage } from "@/services/i18n/util";

import { BlueskyPreview } from "./bluesky_preview";
import { GithubPreview } from "./github_preview";
import styles from "./item_preview.module.css";
import { MediumPreview } from "./medium_preview";

export const ItemPreview = React.memo(function ItemPreview({ item }: { item: NewsItem }) {
  const currentLanguage = useAppStore((store) => store.currentLanguage) as SupportedLanguage;
  const { publishedAt } = item;

  const dateFnsLocale = getLocale(currentLanguage);
  const localDateString = format(publishedAt, "PPP p", { locale: dateFnsLocale });

  const postContent = React.useMemo(() => {
    switch (item.source) {
      case "bluesky":
        return <BlueskyPreview item={item} />;
      case "medium":
        return <MediumPreview item={item} />;
      case "github":
        return <GithubPreview item={item} />;
    }
  }, [item]);

  return (
    <div className={styles.previewContainer}>
      <div className={styles.dateHeader}>{localDateString}</div>
      <div>{postContent}</div>
    </div>
  );
});
