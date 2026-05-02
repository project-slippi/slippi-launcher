import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import { ExternalLink as A } from "@/components/external_link";
import { Button } from "@/components/form/button";
import { LocationGuard } from "@/components/location_guard/location_guard";
import { useAppStore } from "@/lib/hooks/use_app_store";
import { useCountdown } from "@/lib/hooks/use_countdown";
import { useMeleeMajorsQuery } from "@/lib/hooks/use_data_fetch_query";
import { formatDateRange } from "@/lib/time";
import type { SupportedLanguage } from "@/services/i18n/util";

import { MajorCard } from "./major_card/major_card";
import { TournamentsNearMe } from "./tournaments_near_me/tournaments_near_me";
import { UpcomingTournamentsMessages as Messages } from "./upcoming_tournaments.messages";
import styles from "./upcoming_tournaments.module.css";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

const FeaturedMajor = ({
  major,
}: {
  major: {
    name: string;
    imageUrl: string;
    cityAndState: string;
    startggUrl: string;
    startTimestamp: Date;
    endTimestamp: Date;
    timezone: string;
    streamUrl?: string | null;
  };
}) => {
  const now = new Date();
  const isLive = now >= major.startTimestamp && now <= major.endTimestamp;

  const { formatted: countdown } = useCountdown(major.startTimestamp, { format: ["days", "hours", "minutes"] });
  const currentLanguage = useAppStore((store) => store.currentLanguage) as SupportedLanguage;

  const dateRange = formatDateRange(major.startTimestamp, major.endTimestamp, major.timezone, currentLanguage);

  const alreadyEnded = now > major.endTimestamp;
  if (alreadyEnded) {
    return null;
  }

  return (
    <A href={major.startggUrl} className={styles.featuredCard}>
      <div className={styles.featuredCardInner}>
        <div className={styles.featuredImageContainer}>
          <img src={major.imageUrl} alt={major.name} className={styles.featuredImage} />
          <div className={styles.featuredOverlay} />
        </div>

        {isLive && major.streamUrl && (
          <div className={styles.viewStreamButtonContainer}>
            <Button
              size="large"
              startIcon={<PlayArrowIcon />}
              style={{ fontSize: 16 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void window.electron.shell.openExternal(major.streamUrl!);
              }}
            >
              {Messages.viewStream()}
            </Button>
          </div>
        )}
        <div className={styles.featuredContent}>
          {isLive ? (
            <div className={styles.liveBadge}>
              <span className={styles.liveDot} />
              {Messages.inProgress()}
            </div>
          ) : (
            <div className={styles.startsInBadge}>{Messages.startingIn(countdown)}</div>
          )}
          <h2 className={styles.featuredTitle}>{major.name}</h2>
          <div className={styles.featuredMeta}>
            <span>{dateRange}</span>
            <span className={styles.metaDot} />
            <span>{major.cityAndState}</span>
          </div>
        </div>
      </div>
    </A>
  );
};

export const UpcomingTournaments = () => {
  const meleeMajorsQuery = useMeleeMajorsQuery();

  if (meleeMajorsQuery.isLoading) {
    return null;
  }

  const meleeMajors = meleeMajorsQuery.data ?? [];
  const now = new Date();

  const featuredMajor =
    meleeMajors.find((major) => {
      const startTime = major.startTimestamp.getTime();
      const endTime = major.endTimestamp.getTime();
      const nowTime = now.getTime();
      return nowTime >= startTime && nowTime <= endTime;
    }) ??
    meleeMajors.find((major) => {
      const timeUntil = major.startTimestamp.getTime() - now.getTime();
      return timeUntil <= THREE_DAYS_MS;
    });

  const followingMajors = featuredMajor ? meleeMajors.filter((major) => major !== featuredMajor) : meleeMajors;

  return (
    <div className={styles.container}>
      <div className={styles.leftColumn}>
        {featuredMajor && <FeaturedMajor major={featuredMajor} />}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{Messages.upcomingMajors()}</h3>
          <div className={styles.majorGrid}>
            {followingMajors.map((major, index) => (
              <MajorCard
                key={index}
                name={major.name}
                imageUrl={major.imageUrl}
                cityAndState={major.cityAndState}
                startTimestamp={major.startTimestamp}
                endTimestamp={major.endTimestamp}
                timezone={major.timezone}
                startggUrl={major.startggDetailsUrl ?? major.startggUrl}
                entrants={major.entrants}
              />
            ))}
          </div>
        </div>
      </div>
      <div className={styles.rightColumn}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{Messages.tournamentsNearMe()}</h3>
          <div className={styles.nearMeContainer}>
            <LocationGuard>{(locationInfo) => <TournamentsNearMe locationInfo={locationInfo} />}</LocationGuard>
          </div>
        </div>
      </div>
    </div>
  );
};
