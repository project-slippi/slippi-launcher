import React from "react";
import { useNavigate } from "react-router-dom";

import { HomeRoutes } from "../home_routes";
import { ContentBlock } from "./content_block/content_block";
import { MeleeMajorsCarousel } from "./melee_majors_carousel";
import { NewsPreview } from "./news_preview/news_preview";
import { OverviewMessages as Messages } from "./overview.messages";
import styles from "./overview.module.css";
import { RankedStatus } from "./ranked_status/ranked_status";

export const HomeOverview = React.memo(function HomeOverview() {
  const navigate = useNavigate();
  return (
    <div className={styles.container}>
      <ContentBlock
        title={Messages.latestNews()}
        content={<NewsPreview />}
        onClick={() => navigate(HomeRoutes.latestNews())}
      />
      <ContentBlock
        title={Messages.upcomingTournaments()}
        content={<MeleeMajorsCarousel />}
        onClick={() => navigate(HomeRoutes.upcomingTournaments())}
      />
      <div>
        <ContentBlock title={Messages.rankedDay()} content={<RankedStatus />} />
      </div>
    </div>
  );
});
