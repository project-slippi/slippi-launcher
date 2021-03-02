import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import { shell } from "electron";
import React from "react";
import TimeAgo from "react-timeago";

export interface MediumArticleProps {
  imageUrl: string;
  title: string;
  subtitle: string;
  permalink: string;
  publishedAt: number;
}

const useStyles = makeStyles({
  outer: {
    marginBottom: 20,
  },
  media: {
    height: 200,
  },
  date: {
    marginLeft: "auto",
    marginRight: 5,
    fontStyle: "italic",
    opacity: 0.9,
  },
});

export const MediumArticle: React.FC<MediumArticleProps> = ({ imageUrl, title, subtitle, permalink, publishedAt }) => {
  const classes = useStyles();

  const onClick = () => shell.openExternal(permalink);
  return (
    <div className={classes.outer}>
      <Card>
        <CardActionArea onClick={onClick}>
          <CardMedia className={classes.media} image={imageUrl} title={title} />
          <CardContent>
            <Typography gutterBottom variant="h5" component="h2">
              {title}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              {subtitle}
            </Typography>
          </CardContent>
        </CardActionArea>
        <CardActions disableSpacing={true}>
          <Button size="small" color="primary" onClick={onClick}>
            Read more
          </Button>
          <div className={classes.date}>
            <Typography variant="caption">
              Posted <TimeAgo date={new Date(publishedAt)} />
            </Typography>
          </div>
        </CardActions>
      </Card>
    </div>
  );
};
