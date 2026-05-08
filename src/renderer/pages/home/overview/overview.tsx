import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import React from "react";

import { AuthGuard } from "@/components/auth_guard";

import { useHomeNavigation } from "../use_home_page";
import { ContentBlock } from "./content_block/content_block";
import { MeleeMajorsCarousel } from "./melee_majors_carousel";
import { MyRanking } from "./my_ranking/my_ranking";
import { NewsPreview } from "./news_preview/news_preview";
import { OverviewMessages as Messages } from "./overview.messages";
import styles from "./overview.module.css";
import { RankedStatus } from "./ranked_status/ranked_status";

export const HomeOverview = React.memo(function HomeOverview() {
  const navigateToHomeTab = useHomeNavigation();
  return (
    <div className={styles.container}>
      <ContentBlock
        endIcon={<ChevronRightIcon />}
        title={Messages.latestNews()}
        content={<NewsPreview />}
        onClick={() => navigateToHomeTab("news")}
      />
      <ContentBlock
        endIcon={<ChevronRightIcon />}
        title={Messages.upcomingTournaments()}
        content={<MeleeMajorsCarousel />}
        onClick={() => navigateToHomeTab("tournaments")}
      />
      <div className={styles.rankedSidebar}>
        <AuthGuard
          render={() => (
            <div className={styles.myRankingContainer}>
              <MyRanking />
            </div>
          )}
        />
        <ContentBlock title={Messages.rankedDay()} content={<RankedStatus />} />
      </div>
    </div>
  );
});
