import React from "react";

import { useHomeNavigation } from "../use_home_page";
import { ContentBlock } from "./content_block/content_block";
import { MeleeMajorsCarousel } from "./melee_majors_carousel";
import { NewsPreview } from "./news_preview/news_preview";
import { OverviewMessages as Messages } from "./overview.messages";
import styles from "./overview.module.css";
import { RankedProfile } from "./ranked_profile/ranked_profile";
import { RankedStatus } from "./ranked_status/ranked_status";

export const HomeOverview = React.memo(function HomeOverview() {
  const navigateToHomeTab = useHomeNavigation();
  return (
    <div className={styles.container}>
      <ContentBlock title={Messages.latestNews()} content={<NewsPreview />} onClick={() => navigateToHomeTab("news")} />
      <ContentBlock
        title={Messages.upcomingTournaments()}
        content={<MeleeMajorsCarousel />}
        onClick={() => navigateToHomeTab("tournaments")}
      />
      <div className={styles.rankedSidebar}>
        <ContentBlock title={Messages.myRanking()} content={<RankedProfile />} />
        <ContentBlock title={Messages.rankedDay()} content={<RankedStatus />} />
      </div>
    </div>
  );
});
