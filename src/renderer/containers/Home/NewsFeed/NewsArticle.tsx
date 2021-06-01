import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import { NewsItem } from "common/types";
import { shell } from "electron";
import React from "react";
import ReactMarkdown from "react-markdown";
import TimeAgo from "react-timeago";

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
        <CardActionArea onClick={onClick}>
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
              <ArticleBody>
                <ReactMarkdown skipHtml={true}>{body}</ReactMarkdown>
              </ArticleBody>
            )}
          </CardContent>
        </CardActionArea>
        <CardActions disableSpacing={true}>
          <Button size="small" color="primary" onClick={onClick}>
            Read more
          </Button>
          <DateInfo>
            <Typography variant="caption">
              Posted <TimeAgo date={new Date(publishedAt)} />
            </Typography>
          </DateInfo>
        </CardActions>
      </Card>
    </Outer>
  );
};

const ArticleBody = styled.div`
  color: #ccc;
  max-width: 700px;

  img {
    display: list-item;
  }

  li {
    margin-bottom: 5px;

    ul {
      margin-top: 5px;
    }
  }
`;

const Outer = styled.div`
  margin-bottom: 20px;
`;

const DateInfo = styled.div`
  margin-left: auto;
  margin-right: 5px;
  opacity: 0.9;
`;
