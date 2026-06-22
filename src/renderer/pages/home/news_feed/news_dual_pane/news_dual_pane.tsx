import type { NewsItem } from "@common/types";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import React from "react";

import { InfiniteScrollContainer } from "@/components/infinite_scroll_container/infinite_scroll_container";
import { useAppStore } from "@/lib/hooks/use_app_store";
import type { SupportedLanguage } from "@/services/i18n/util";

import { NewsArticleContainer } from "../news_article/news_article.container";
import { ListItem } from "./list_item";
import { NewsDualPaneMessages as Messages } from "./news_dual_pane.messages";
import styles from "./news_dual_pane.module.css";
import { isNewsUnread, useNewsReadStore } from "./news_read_store";

const INITIAL_VISIBLE = 20;
const LOAD_MORE_COUNT = 10;

export const NewsDualPane = React.memo(function NewsDualPane({
  posts,
  selectedNewsId,
  onSelectedNewsIdChange,
}: {
  posts: readonly NewsItem[];
  selectedNewsId: string | null;
  onSelectedNewsIdChange: (id: string | null) => void;
}) {
  const [visibleCount, setVisibleCount] = React.useState(INITIAL_VISIBLE);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [mobilePageOpen, setMobilePageOpen] = React.useState(!!selectedNewsId);

  React.useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [selectedNewsId]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const currentLanguage = useAppStore((store) => store.currentLanguage) as SupportedLanguage;

  const markAsRead = useNewsReadStore((store) => store.markAsRead);
  const readStatus = useNewsReadStore((store) => store.readStatus);

  // This will default to the first post if no post is selected
  const selectedPost = React.useMemo(
    (): NewsItem | undefined => posts.find((p) => p.id === selectedNewsId) ?? posts[0],
    [posts, selectedNewsId],
  );
  const visiblePosts = React.useMemo(() => posts.slice(0, visibleCount), [posts, visibleCount]);
  const hasMore = visibleCount < posts.length;

  const handleSelect = React.useCallback(
    (post: NewsItem) => {
      onSelectedNewsIdChange(post.id);
      setMobilePageOpen(true);

      // Mark the news as read if it was unread to begin with
      if (isNewsUnread(post, readStatus)) {
        markAsRead(post.id);
      }
    },
    [markAsRead, onSelectedNewsIdChange, readStatus],
  );

  const handleLoadMore = React.useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, posts.length));
  }, [posts.length]);

  const handleBack = React.useCallback(() => {
    setMobilePageOpen(false);
  }, [setMobilePageOpen]);

  const listContent = visiblePosts.map((post) => (
    <ListItem
      key={post.id}
      item={post}
      selected={post.id === selectedPost?.id}
      isUnread={isNewsUnread(post, readStatus)}
      currentLanguage={currentLanguage}
      onClick={() => handleSelect(post)}
    />
  ));

  const listPane = (
    <InfiniteScrollContainer
      className={isMobile ? styles.mobileList : styles.listPane}
      onLoadMore={handleLoadMore}
      hasMore={hasMore}
      persistScrollId="news-feed-list"
    >
      {listContent}
    </InfiniteScrollContainer>
  );

  if (isMobile) {
    if (mobilePageOpen) {
      return (
        <div className={styles.mobileContainer}>
          <button className={styles.backButton} onClick={handleBack}>
            <ArrowBack fontSize="small" />
            {Messages.back()}
          </button>
          <div ref={scrollRef} className={styles.mobileDetail}>
            <NewsArticleContainer item={selectedPost} />
          </div>
        </div>
      );
    }
    return listPane;
  }

  return (
    <div className={styles.container}>
      {listPane}
      <div ref={scrollRef} className={styles.detailPane}>
        <div className={styles.detailPaneContent}>
          <NewsArticleContainer item={selectedPost} />
        </div>
      </div>
    </div>
  );
});
