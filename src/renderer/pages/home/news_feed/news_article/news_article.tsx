import type { NewsItem } from "@common/types";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import stylex from "@stylexjs/stylex";
import { format } from "date-fns";
import React from "react";
import TimeAgo from "react-timeago";

import { ExternalLink } from "@/components/external_link";
import { MarkdownContent } from "@/components/markdown_content/markdown_content";

const styles = stylex.create({
  container: {
    marginBottom: 20,
  },
  titleHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  dateInfo: {
    marginRight: "auto",
    marginLeft: 5,
    opacity: 0.6,
    fontSize: 15,
  },
  fixedCardHeight: {
    height: 200,
  },
  markdownContainer: {
    color: "#ccc",
    maxWidth: 700,
  },
});

export const NewsArticle = React.memo(function NewsArticle({ item }: { item: NewsItem }) {
  const { imageUrl, title, subtitle, permalink, body, publishedAt } = item;
  const localDateString = format(new Date(publishedAt), "PPP p");
  const isBluesky = item.id.startsWith("bluesky-");

  return (
    <div {...stylex.props(styles.container)}>
      <Card>
        {imageUrl && !isBluesky && (
          <CardMedia {...stylex.props(styles.fixedCardHeight)} image={imageUrl} title={title} />
        )}
        <CardContent>
          <div {...stylex.props(styles.titleHeader)}>
            {isBluesky && imageUrl && (
              <CardMedia
                {...stylex.props(styles.fixedCardHeight)}
                image={imageUrl}
                style={{ width: 45, height: 45, borderRadius: "50%" }}
              />
            )}
            <div>
              <Typography variant="h5" component="h2" fontSize={isBluesky ? 22 : undefined}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="textSecondary" component="p">
                  {subtitle}
                </Typography>
              )}
            </div>
          </div>
          {body && <MarkdownContent content={body} {...stylex.props(styles.markdownContainer)} />}
        </CardContent>
        <CardActions disableSpacing={true}>
          <Tooltip title={localDateString}>
            <div {...stylex.props(styles.dateInfo)}>
              Posted <TimeAgo date={publishedAt} title="" live={false} />
            </div>
          </Tooltip>
          <Button LinkComponent={ExternalLink} size="small" color="primary" href={permalink}>
            {isBluesky ? "View on Bluesky" : "Read more"}
          </Button>
        </CardActions>
      </Card>
    </div>
  );
});
