import React from "react";

import { AuthGuard } from "@/components/auth_guard";

import { ContentBlock } from "./content_block/content_block";
import { MeleeMajorsCarousel } from "./melee_majors_carousel/melee_majors_carousel";
import { MyRanking } from "./my_ranking/my_ranking";
import { NewsPreview } from "./news_preview/news_preview";
import { OverviewMessages as Messages } from "./overview.messages";
import styles from "./overview.module.css";
import { RankedDayStatus } from "./ranked_day_status/ranked_day_status";

export const HomeOverview = React.memo(function HomeOverview() {
  return (
    <div className={styles.container}>
      <ContentBlock title={Messages.latestNews()} content={<NewsPreview />} />
      <ContentBlock title={Messages.upcomingTournaments()} content={<MeleeMajorsCarousel />} />
      <div className={styles.rankedSidebar}>
        <AuthGuard render={() => <MyRanking />} />
        <ContentBlock content={<RankedDayStatus />} />
      </div>
    </div>
  );
});
