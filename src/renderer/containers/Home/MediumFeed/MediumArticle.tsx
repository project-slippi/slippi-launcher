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
import styled from "styled-components";

export interface MediumArticleProps {
  imageUrl: string;
  title: string;
  subtitle: string;
  permalink: string;
}

const Outer = styled.div`
  margin-bottom: 20px;
`;

const useStyles = makeStyles({
  media: {
    height: 140,
  },
});

export const MediumArticle: React.FC<MediumArticleProps> = ({ imageUrl, title, subtitle, permalink }) => {
  const classes = useStyles();

  const onClick = () => shell.openExternal(permalink);
  return (
    <Outer>
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
        <CardActions>
          <Button size="small" color="primary" onClick={onClick}>
            Read more
          </Button>
        </CardActions>
      </Card>
    </Outer>
  );
};
