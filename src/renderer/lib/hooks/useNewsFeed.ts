import type { NewsItem } from "@common/types";
import create from "zustand";
import { combine } from "zustand/middleware";

const log = window.electron.log;

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

        window.electron.common
          .fetchNewsFeed()
          .then((newsItems) => {
            set({ newsItems });
          })
          .catch((err) => {
            log.error(err);
            set({ error: err });
          })
          .finally(() => {
            set({ fetching: false });
          });
      },
    }),
  ),
);
