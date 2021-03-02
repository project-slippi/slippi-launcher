import Typography from "@material-ui/core/Typography";
import { ipcRenderer as ipc } from "electron-better-ipc";
import React from "react";
import { useQuery } from "react-query";
import styled from "styled-components";

import { MediumArticle } from "./MediumArticle";

const Outer = styled.div`
  flex: 1;
  padding: 20px;
`;

export const MediumFeed: React.FC = () => {
  const mediumFeedQuery = useQuery(["medium-articles"], () => ipc.callMain<never, any>("fetchMediumFeed"));
  if (mediumFeedQuery.isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <Outer>
      <Typography variant="h4" style={{ marginBottom: 20 }}>
        Latest News
      </Typography>
      {mediumFeedQuery.data.map((post: any) => (
        <MediumArticle
          key={post.id}
          imageUrl={`https://cdn-images-1.medium.com/${post.virtuals.previewImage.imageId}`}
          title={post.title}
          subtitle={post.virtuals.subtitle}
          permalink={`https://medium.com/project-slippi/${post.uniqueSlug}`}
        />
      ))}
    </Outer>
  );
};
