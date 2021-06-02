import { fetchNewsFeed } from "common/ipc";
import { NewsItem } from "common/types";
import log from "electron-log";
import create from "zustand";
import { combine } from "zustand/middleware";

export const useNewsFeed = create(
  combine(
    {
      error: null as any,
      fetching: false,
      newsItems: [] as NewsItem[],
    },
    (set) => ({
      update: () => {
        log.info("Fetching news articles...");
        set({ fetching: true });

        fetchNewsFeed
          .renderer!.trigger({})
          .then((articlesResult) => {
            if (!articlesResult.result) {
              log.warn("NewsFeed: error fetching news articles", articlesResult.errors);
              set({ error: articlesResult.errors });
              return;
            }
            const newsItems = articlesResult.result;
            set({ newsItems });
          })
          .finally(() => {
            set({ fetching: false });
          });
      },
    }),
  ),
);
