import Button from "@mui/material/Button";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { LoadingScreen } from "@/components/loading_screen/loading_screen";
import { useNewsFeedQuery } from "@/lib/hooks/use_data_fetch_query";
import { useTabMemory } from "@/lib/hooks/use_tab_memory";

import { NewsDualPane } from "./news_dual_pane/news_dual_pane";
import { NewsFeedMessages as Messages } from "./news_feed.messages";

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
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ marginRight: 10 }}>{Messages.failedToFetch()}</div>
        <Button color="primary" variant="text" size="small" onClick={() => refetch()}>
          {Messages.tryAgain()}
        </Button>
      </div>
    );
  }

  return <NewsDualPane posts={allPosts} selectedNewsId={newsId} onSelectedNewsIdChange={onNewsIdChange} />;
});

export const NewsFeed = React.memo(function NewsFeed() {
  const params = useParams();
  const navigate = useNavigate();

  const activeTab = params.tab;
  const urlNewsId = (params["*"] as string) || null;

  const setTabParam = useTabMemory((s) => s.setTabParam);
  const memorizedNewsId = useTabMemory((s) => s.tabState["home:news"]?.newsId ?? null);

  React.useEffect(() => {
    if (urlNewsId) {
      setTabParam("home", "news", "newsId", urlNewsId);
    } else if (activeTab === "news" && memorizedNewsId) {
      navigate(memorizedNewsId, { relative: "route", replace: true });
    }
  }, [urlNewsId, activeTab, memorizedNewsId, navigate, setTabParam]);

  const handleNewsIdChange = React.useCallback(
    (id: string | null) => {
      if (id) {
        setTabParam("home", "news", "newsId", id);
        navigate(id, { relative: "route" });
      } else {
        setTabParam("home", "news", "newsId", null);
        navigate("..");
      }
    },
    [navigate, setTabParam],
  );

  const newsId = urlNewsId ?? memorizedNewsId;

  return (
    <div style={{ height: "100%" }}>
      <NewsFeedContent newsId={newsId} onNewsIdChange={handleNewsIdChange} />
    </div>
  );
});
