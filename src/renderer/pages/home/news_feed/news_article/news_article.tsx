import type { NewsItem } from "@common/types";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import Tooltip from "@mui/material/Tooltip";
import stylex from "@stylexjs/stylex";
import { format, formatDistance } from "date-fns";
import React from "react";

import { ExternalLink } from "@/components/external_link";
import { getLocale } from "@/lib/time";
import type { SupportedLanguage } from "@/services/i18n/util";

import { BlueskyPost } from "./bluesky_post";
import { GithubPost } from "./github_post";
import { MediumPost } from "./medium_post";
import { NewsArticleMessages as Messages } from "./news_article.messages";

const styles = stylex.create({
  container: {
    marginBottom: 20,
  },
  dateInfo: {
    marginRight: "auto",
    marginLeft: 5,
    opacity: 0.6,
    fontSize: 15,
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
});

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
}: {
  item: NewsItem;
  currentLanguage: SupportedLanguage;
}) {
  const { permalink, publishedAt } = item;

  const publishedDate = new Date(publishedAt);
  const dateFnsLocale = getLocale(currentLanguage);
  const localDateString = format(publishedDate, "PPP p", { locale: dateFnsLocale });
  const timeAgo = formatDistance(publishedDate, new Date(), {
    addSuffix: true,
    locale: dateFnsLocale,
  });

  const postContent = React.useMemo(() => {
    switch (item.source) {
      case "bluesky":
        return <BlueskyPost item={item} />;
      case "medium":
        return <MediumPost item={item} />;
      case "github":
        return <GithubPost item={item} />;
    }
  }, [item]);

  return (
    <div {...stylex.props(styles.container)}>
      <Card>
        {postContent}
        <CardActions disableSpacing={true} {...stylex.props(styles.cardActions)}>
          <Tooltip title={localDateString}>
            <div {...stylex.props(styles.dateInfo)}>{Messages.posted(timeAgo)}</div>
          </Tooltip>
          <Button LinkComponent={ExternalLink} size="small" color="primary" href={permalink}>
            {getViewPostButtonText(item.source)}
          </Button>
        </CardActions>
      </Card>
    </div>
  );
});
