import { useQuery } from "@tanstack/react-query";

import { useServices } from "@/services";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

export const useNewsFeedQuery = () => {
  const { contentManagementService } = useServices();
  return useQuery({
    queryKey: ["newsFeedQuery"],
    queryFn: () => contentManagementService.fetchNewsFeed(),
    // Probably won't change that much so this should be fine
    staleTime: 15 * MINUTE,
  });
};

export const useMeleeMajorsQuery = () => {
  const { contentManagementService } = useServices();
  return useQuery({
    queryKey: ["meleeMajorsQuery"],
    queryFn: () => contentManagementService.fetchUpcomingMeleeMajors(),
    // The melee majors list rarely ever changes so we probably don't need to fetch often at all
    staleTime: 24 * HOUR,
  });
};
