import type { NewsItem } from "@common/types";
import React from "react";

import { useAppStore } from "@/lib/hooks/use_app_store";
import type { SupportedLanguage } from "@/services/i18n/util";

import { NewsArticle } from "./news_article";

export const NewsArticleContainer = React.memo(function NewsArticleContainer({
  item,
  autoTruncate,
}: {
  item: NewsItem;
  autoTruncate?: boolean;
}) {
  const currentLanguage = useAppStore((store) => store.currentLanguage) as SupportedLanguage;
  return <NewsArticle item={item} currentLanguage={currentLanguage} autoTruncate={autoTruncate} />;
});
