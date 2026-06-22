import Newspaper from "@mui/icons-material/Newspaper";
import Button from "@mui/material/Button";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { LoadingScreen } from "@/components/loading_screen/loading_screen";
import { useNewsFeedQuery } from "@/lib/hooks/use_data_fetch_query";
import { useRouteMemory } from "@/lib/hooks/use_route_memory";

import { NewsDualPane } from "./news_dual_pane/news_dual_pane";
import { NewsFeedMessages as Messages } from "./news_feed.messages";
import styles from "./news_feed.module.css";

const NewsFeedContent = React.memo(function NewsFeedContent({
  newsId,
  onNewsIdChange,
}: {
  newsId: string | null;
  onNewsIdChange: (id: string | null) => void;
}) {
  const { isLoading, error, data: allPosts = [], refetch } = useNewsFeedQuery();

  if (isLoading) {
    return <LoadingScreen message={Messages.loading()} />;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p>{Messages.failedToFetch()}</p>
        <Button color="primary" variant="text" size="small" onClick={() => refetch()}>
          {Messages.tryAgain()}
        </Button>
      </div>
    );
  }

  if (allPosts.length === 0) {
    return (
      <div className={styles.container}>
        <Newspaper style={{ fontSize: 64 }} />
        <h3>{Messages.noNews()}</h3>
      </div>
    );
  }

  return <NewsDualPane posts={allPosts} selectedNewsId={newsId} onSelectedNewsIdChange={onNewsIdChange} />;
});

export const NewsFeed = React.memo(function NewsFeed() {
  const params = useParams();
  const navigate = useNavigate();

  const urlNewsId = (params["*"] as string) || null;

  const memorizedNewsId = useRouteMemory((s) => s.routeMemory["newsFeed"]) ?? null;
  const setLastRoute = useRouteMemory((s) => s.setLastRoute);

  React.useEffect(() => {
    if (urlNewsId) {
      setLastRoute("newsFeed", urlNewsId);
    } else if (memorizedNewsId) {
      navigate(memorizedNewsId, { relative: "route", replace: true });
    }
  }, [urlNewsId, memorizedNewsId, navigate, setLastRoute]);

  const handleNewsIdChange = React.useCallback(
    (id: string | null) => {
      if (id) {
        setLastRoute("newsFeed", id);
        navigate(id, { relative: "route" });
      } else {
        setLastRoute("newsFeed", "");
        navigate("..");
      }
    },
    [navigate, setLastRoute],
  );

  const newsId = urlNewsId ?? memorizedNewsId;

  return (
    <div style={{ height: "100%", overflow: "hidden" }}>
      <NewsFeedContent newsId={newsId} onNewsIdChange={handleNewsIdChange} />
    </div>
  );
});
