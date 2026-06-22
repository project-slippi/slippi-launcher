import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { clsx } from "clsx";

import { useAppStore } from "@/lib/hooks/use_app_store";
import { useMeleeMajorsQuery } from "@/lib/hooks/use_data_fetch_query";
import { formatDateRange, formatRelativeDate } from "@/lib/time";
import type { SupportedLanguage } from "@/services/i18n/util";

import { Carousel } from "../carousel/carousel";
import { MeleeMajorsCarouselMessages as Messages } from "./melee_majors_carousel.messages";
import styles from "./melee_majors_carousel.module.css";

const LIMIT = 4;

export const MeleeMajorsCarousel = () => {
  const { isLoading, error, data, refetch, isFetching } = useMeleeMajorsQuery();
  const currentLanguage = useAppStore((store) => store.currentLanguage) as SupportedLanguage;

  const now = Date.now();

  if (isLoading) {
    return (
      <div className={styles.centered}>
        <CircularProgress color="inherit" />
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div className={clsx(styles.centered, styles.column)}>
        <EventBusyIcon style={{ fontSize: 64 }} />
        <h3>{Messages.failedToFetchMeleeMajors()}</h3>
        <Button color="secondary" onClick={() => refetch()} disabled={isFetching}>
          {Messages.retry()}
        </Button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={clsx(styles.centered, styles.column)}>
        <CalendarTodayIcon style={{ fontSize: 64 }} />
        <h3>{Messages.noMeleeMajors()}</h3>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Carousel
        items={data.slice(0, LIMIT).map((tournament) => {
          const isHappeningNow = tournament.startTimestamp.getTime() < now && tournament.endTimestamp.getTime() > now;
          const tournamentDate = formatDateRange(
            tournament.startTimestamp,
            tournament.endTimestamp,
            tournament.timezone,
            currentLanguage,
          );
          const timeUntilTournament = formatRelativeDate(tournament.startTimestamp, currentLanguage);
          const subtitle = `${tournamentDate} • ${tournament.cityAndState}`;
          return {
            title: tournament.name,
            subtitle,
            image: tournament.imageUrl,
            link: tournament.tournamentUrl ?? tournament.bracketUrl,
            isHappeningNow,
            countdown: isHappeningNow ? undefined : timeUntilTournament,
            streamUrl: tournament.streamUrl ?? undefined,
          };
        })}
      />
    </div>
  );
};
