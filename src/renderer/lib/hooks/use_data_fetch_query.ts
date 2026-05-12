import { useQuery } from "@tanstack/react-query";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

export const useNewsFeedQuery = () => {
  return useQuery({
    queryKey: ["newsFeedQuery"],
    queryFn: () => window.electron.common.fetchNewsFeed(),
    // Probably won't change that much so this should be fine
    staleTime: 15 * MINUTE,
  });
};

export const useMeleeMajorsQuery = () => {
  return useQuery({
    queryKey: ["meleeMajorsQuery"],
    queryFn: () => window.electron.fetch.fetchUpcomingMeleeMajors(),
    // The melee majors list rarely ever changes so we probably don't need to fetch often at all
    staleTime: 24 * HOUR,
  });
};
