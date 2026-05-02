import PeopleIcon from "@mui/icons-material/People";
import { clsx } from "clsx";

import { ExternalLink as A } from "@/components/external_link";
import { useAppStore } from "@/lib/hooks/use_app_store";
import { formatDateRange, formatRelativeDate } from "@/lib/time";
import type { SupportedLanguage } from "@/services/i18n/util";

import { MajorCardMessages as Messages } from "./major_card.messages";
import styles from "./major_card.module.css";

type MajorCardProps = {
  name: string;
  imageUrl: string;
  cityAndState: string;
  startTimestamp: Date;
  endTimestamp: Date;
  timezone: string;
  startggUrl: string;
  entrants: number | null;
};

export const MajorCard = ({
  name,
  imageUrl,
  cityAndState,
  startTimestamp,
  endTimestamp,
  timezone,
  startggUrl,
  entrants,
}: MajorCardProps) => {
  const currentLanguage = useAppStore((store) => store.currentLanguage) as SupportedLanguage;
  let countdown = formatRelativeDate(startTimestamp, currentLanguage);
  const now = Date.now();
  const isHappeningNow = startTimestamp.getTime() < now && endTimestamp.getTime() > now;
  if (isHappeningNow) {
    countdown = Messages.inProgress();
  }

  const dateRange = formatDateRange(startTimestamp, endTimestamp, timezone, currentLanguage);

  return (
    <A href={startggUrl} className={styles.card}>
      <div className={styles.imageContainer}>
        <img src={imageUrl} alt={name} className={styles.image} />
      </div>
      <div className={styles.content}>
        <div className={clsx(styles.countdownOverlay, isHappeningNow && styles.happeningNow)}>
          <span className={styles.countdown}>{countdown}</span>
        </div>
        <div className={styles.name}>{name}</div>
        <div className={styles.meta}>
          <span>{dateRange}</span>
          <span className={styles.dot} />
          <span>{cityAndState}</span>
        </div>
        {entrants !== null && (
          <div className={styles.entrants}>
            <PeopleIcon style={{ fontSize: "18pt" }} />
            <span className={styles.entrantsCount}>{entrants.toLocaleString()}</span>
          </div>
        )}
      </div>
    </A>
  );
};
