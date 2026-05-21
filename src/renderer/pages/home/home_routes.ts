export const HOME_ROUTE_PATTERN = "home";

export const HOME_TABS = ["overview", "news", "tournaments"] as const;
export type HomeTab = (typeof HOME_TABS)[number];

export const HomeRoutes = {
  overview: () => "/main/home/overview" as const,
  latestNews: (articleId?: string) => (articleId ? `/main/home/news/${articleId}` : "/main/home/news"),
  upcomingTournaments: () => "/main/home/tournaments" as const,
};
