import { useAppStore } from "@/lib/hooks/use_app_store";
import { useMeleeMajorsQuery } from "@/lib/hooks/use_data_fetch_query";
import { formatDateRange, formatRelativeDate } from "@/lib/time";
import type { SupportedLanguage } from "@/services/i18n/util";

import { Carousel } from "./carousel/carousel";

const LIMIT = 4;

export const MeleeMajorsCarousel = () => {
  const meleeMajorsQuery = useMeleeMajorsQuery();
  const currentLanguage = useAppStore((store) => store.currentLanguage) as SupportedLanguage;

  const now = Date.now();

  return (
    <div style={{ height: "100%", width: "100%" }}>
      {meleeMajorsQuery.data && (
        <Carousel
          items={meleeMajorsQuery.data.slice(0, LIMIT).map((tournament) => {
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
              link: tournament.startggDetailsUrl ?? tournament.startggUrl,
              isHappeningNow,
              countdown: isHappeningNow ? undefined : timeUntilTournament,
              streamUrl: tournament.streamUrl ?? undefined,
            };
          })}
        />
      )}
    </div>
  );
};
