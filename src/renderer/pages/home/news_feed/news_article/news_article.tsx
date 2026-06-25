import type { NewsItem } from "@common/types";
import Button from "@mui/material/Button";
import { format } from "date-fns";
import React from "react";

import { ExternalLink } from "@/components/external_link";
import { getLocale } from "@/lib/time";
import type { SupportedLanguage } from "@/services/i18n/util";

import { BlueskyPost } from "./bluesky_post";
import { GithubPost } from "./github_post";
import { MediumPost } from "./medium_post";
import { NewsArticleMessages as Messages } from "./news_article.messages";
import styles from "./news_article.module.css";

function getViewPostButtonText(source: NewsItem["source"]) {
  switch (source) {
    case "bluesky":
      return Messages.viewOnBluesky();
    case "medium":
      return Messages.viewOnMedium();
    case "github":
      return Messages.viewOnGithub();
  }
}

export const NewsArticle = React.memo(function NewsArticle({
  item,
  currentLanguage,
  autoTruncate,
}: {
  item: NewsItem;
  currentLanguage: SupportedLanguage;
  autoTruncate?: boolean;
}) {
  const { permalink, publishedAt } = item;

  const dateFnsLocale = getLocale(currentLanguage);
  const localDateString = format(publishedAt, "PPP p", { locale: dateFnsLocale });

  const postContent = React.useMemo(() => {
    switch (item.source) {
      case "bluesky":
        return <BlueskyPost item={item} />;
      case "medium":
        return <MediumPost item={item} autoTruncate={autoTruncate} />;
      case "github":
        return <GithubPost item={item} />;
    }
  }, [item, autoTruncate]);

  return (
    <div className={styles.container}>
      <div className={styles.cardActions}>
        <div className={styles.dateInfo}>{localDateString}</div>
        <Button LinkComponent={ExternalLink} size="small" color="secondary" href={permalink}>
          {getViewPostButtonText(item.source)}
        </Button>
      </div>
      {postContent}
    </div>
  );
});
