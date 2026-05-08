import type { NewsItem } from "@common/types";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import React from "react";

import { useAppStore } from "@/lib/hooks/use_app_store";
import type { SupportedLanguage } from "@/services/i18n/util";

import { NewsArticleContainer } from "../news_article/news_article.container";
import { ListItem } from "./list_item";
import { NewsDualPaneMessages as Messages } from "./news_dual_pane.messages";
import styles from "./news_dual_pane.module.css";

export const NewsDualPane = React.memo(function NewsDualPane({ posts }: { posts: NewsItem[] }) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const scrollPositionRef = React.useRef(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const currentLanguage = useAppStore((store) => store.currentLanguage) as SupportedLanguage;

  const selectedPost = React.useMemo(() => posts.find((p) => p.id === selectedId) ?? null, [posts, selectedId]);

  const handleSelect = React.useCallback((id: string) => {
    if (listRef.current) {
      scrollPositionRef.current = listRef.current.scrollTop;
    }
    setSelectedId(id);
  }, []);

  const handleBack = React.useCallback(() => {
    setSelectedId(null);
  }, []);

  React.useEffect(() => {
    if (!selectedId && listRef.current) {
      listRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [selectedId]);

  const listContent = posts.map((post) => (
    <ListItem
      key={post.id}
      item={post}
      selected={post.id === selectedId}
      currentLanguage={currentLanguage}
      onClick={() => handleSelect(post.id)}
    />
  ));

  const listPane = (
    <div ref={listRef} className={isMobile ? styles.mobileList : styles.listPane}>
      {listContent}
    </div>
  );

  if (isMobile) {
    if (selectedId && selectedPost) {
      return (
        <div className={styles.mobileContainer}>
          <button className={styles.backButton} onClick={handleBack}>
            <ArrowBack fontSize="small" />
            {Messages.back()}
          </button>
          <div className={styles.mobileDetail}>
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
      {selectedPost ? (
        <div className={styles.detailPane}>
          <NewsArticleContainer item={selectedPost} />
        </div>
      ) : (
        <div className={styles.detailEmpty}>{Messages.selectArticle()}</div>
      )}
    </div>
  );
});
