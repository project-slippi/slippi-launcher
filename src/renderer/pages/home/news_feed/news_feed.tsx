import { css } from "@emotion/react";
import Button from "@mui/material/Button";
import React from "react";
import { useQuery } from "react-query";

import { LoadingScreen } from "@/components/loading_screen";

import { AdBanner } from "./ad_banner";
import { NewsArticle } from "./news_article/news_article";
import { NewsFeedMessages as Messages } from "./news_feed.messages";

const ITEMS_TO_SHOW = 7;
const BATCH_SIZE = 5;

const mediumPostQuery = `
  query PublicationSectionPostsQuery($postIds: [ID!]!) {
    postResults(postIds: $postIds) {
      ... on Post {
        id
        previewImage {
          id
        }
        title
        extendedPreviewContent {
          subtitle
        }
        mediumUrl
        latestPublishedAt
      }
    }
  }`;

const NewsFeedContent = React.memo(function NewsFeedContent() {
  const [numItemsToShow, setNumItemsToShow] = React.useState(ITEMS_TO_SHOW);
  const newsFeedQuery = useQuery(["newsFeedQuery"], window.electron.common.fetchNewsFeed);
  const { isLoading, error, data: allPosts = [], refetch } = newsFeedQuery;

  const onShowMore = React.useCallback(() => {
    setNumItemsToShow(numItemsToShow + BATCH_SIZE);
  }, [setNumItemsToShow, numItemsToShow]);

  React.useEffect(() => {
    // This is just some test code to see if we can avoid being forbidden when sending from the renderer
    // Currently fails because of CORS with webSecurity enabled
    const fetchPosts = async () => {
      const gqlRes = await fetch("https://medium.com/_/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: mediumPostQuery,
          variables: {
            postIds: ["f557d00d2474", "370a830bf88b", "33c679dd73bd", "4080c81d7205"],
          },
        }),
      });

      if (!gqlRes.ok) {
        throw new Error(`Error fetching Medium posts: ${gqlRes.statusText}`);
      }

      const gqlJson = await gqlRes.json();
      return gqlJson;
    };

    fetchPosts()
      .then((res) => {
        console.log("Fetched Medium posts:", res);
      })
      .catch((err) => {
        console.error("Error fetching Medium posts:", err);
      });
  }, []);

  const posts = React.useMemo(() => {
    return numItemsToShow <= 0 ? allPosts : allPosts.slice(0, numItemsToShow);
  }, [allPosts, numItemsToShow]);

  if (isLoading) {
    return <LoadingScreen message={Messages.loading()} />;
  }

  if (error) {
    return (
      <div
        css={css`
          display: flex;
          align-items: center;
        `}
      >
        <div
          css={css`
            margin-right: 10px;
          `}
        >
          {Messages.failedToFetch()}
        </div>
        <Button color="primary" variant="text" size="small" onClick={() => refetch()}>
          {Messages.tryAgain()}
        </Button>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <NewsArticle key={post.id} item={post} />
      ))}
      {allPosts.length > posts.length && (
        <div
          css={css`
            text-align: center;
          `}
        >
          <Button color="primary" variant="contained" size="small" onClick={onShowMore}>
            {Messages.showMore()}
          </Button>
        </div>
      )}
      <AdBanner />
    </div>
  );
});

export const NewsFeed = React.memo(function NewsFeed() {
  return (
    <>
      <h1>{Messages.latestNews()}</h1>
      <NewsFeedContent />
    </>
  );
});
