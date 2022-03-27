import type { NewsItem } from "@common/types";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@mui/material/Button";
import React from "react";

import { NewsArticle } from "./NewsArticle";

const Outer = styled.div`
  flex: 1;
  overflow-x: hidden;
  padding: 20px;
  padding-top: 0;
`;

type NewsFeedProps = {
  posts: NewsItem[];
  total: number;
  onShowMore: () => void;
};

export const NewsFeed = React.forwardRef<HTMLDivElement, NewsFeedProps>(({ posts, total, onShowMore }, ref) => {
  return (
    <Outer ref={ref}>
      <h1>Latest News</h1>
      {posts.map((post) => (
        <NewsArticle key={post.id} item={post} />
      ))}
      {total > posts.length && (
        <div
          css={css`
            text-align: center;
          `}
        >
          <Button color="primary" variant="contained" size="small" onClick={onShowMore}>
            Show more
          </Button>
        </div>
      )}
    </Outer>
  );
});
