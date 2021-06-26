/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import { NewsItem } from "common/types";
import { shell } from "electron";
import React from "react";
import TimeAgo from "react-timeago";

import { MarkdownContent } from "@/components/MarkdownContent";

export interface NewsArticleProps {
  item: NewsItem;
}

const useStyles = makeStyles({
  media: {
    height: 200,
  },
});

export const NewsArticle: React.FC<NewsArticleProps> = ({ item }) => {
  const classes = useStyles();
  const { imageUrl, title, subtitle, permalink, body, publishedAt } = item;

  const onClick = () => shell.openExternal(permalink);
  return (
    <Outer>
      <Card>
        {imageUrl && <CardMedia className={classes.media} image={imageUrl} title={title} />}
        <CardContent>
          <Typography gutterBottom variant="h5" component="h2">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary" component="p">
              {subtitle}
            </Typography>
          )}
          {body && (
            <MarkdownContent
              content={body}
              css={css`
                color: #ccc;
                max-width: 700px;
              `}
            />
          )}
        </CardContent>
        <CardActions disableSpacing={true}>
          <DateInfo>
            Posted <TimeAgo date={new Date(publishedAt)} />
          </DateInfo>
          <Button size="small" color="primary" onClick={onClick}>
            Read more
          </Button>
        </CardActions>
      </Card>
    </Outer>
  );
};

const Outer = styled.div`
  margin-bottom: 20px;
`;

const DateInfo = styled.div`
  margin-right: auto;
  margin-left: 5px;
  opacity: 0.6;
  font-size: 15px;
`;
