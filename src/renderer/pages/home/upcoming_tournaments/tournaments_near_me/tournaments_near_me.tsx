import PeopleIcon from "@mui/icons-material/People";
import Button from "@mui/material/Button";
import { clsx } from "clsx";
import type { UserLocationInfo } from "main/fetch_cross_origin/ip_api";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";

import { ExternalLink as A, ExternalLink } from "@/components/external_link";
import { useAppStore } from "@/lib/hooks/use_app_store";
import { formatDateRange, formatRelativeDate } from "@/lib/time";
import type { SupportedLanguage } from "@/services/i18n/util";

import { type DistanceValue, type UnitValue, DistanceUnitSelect } from "./select/distance_unit_select";
import { Select } from "./select/select";
import { TournamentsNearMeMessages as Messages } from "./tournaments_near_me.messages";
import styles from "./tournaments_near_me.module.css";

type SortOption = "distance" | "date" | "entrants";

const KM_TO_MILE = 0.621371;

const STORAGE_KEY_RADIUS = "nearbyTournamentRadius";
const STORAGE_KEY_UNITS = "nearbyTournamentUnits";
const STORAGE_KEY_SORT = "nearbyTournamentSort";

const loadStoredValue = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      return JSON.parse(stored) as T;
    }
  } catch {
    // Ignore parse errors
  }
  return defaultValue;
};

const storeValue = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
};

const NearbyTournamentCard = ({
  name,
  url,
  imageSrc,
  distance,
  startDate,
  endDate,
  timezone,
  entrantCount,
}: {
  name: string;
  url: string;
  imageSrc: string;
  distance: { distance: number; units: "km" | "mi" };
  startDate: Date;
  endDate: Date;
  timezone: string;
  entrantCount: number;
}) => {
  const currentLanguage = useAppStore((store) => store.currentLanguage) as SupportedLanguage;
  const dateRange = formatDateRange(startDate, endDate, timezone, currentLanguage);
  let countdown = formatRelativeDate(startDate, currentLanguage);

  const now = new Date();
  const isLive = now >= startDate && now <= endDate;
  if (isLive) {
    countdown = Messages.inProgress();
  }

  return (
    <A href={url} className={styles.card}>
      <img src={imageSrc} alt={name} className={styles.thumbnail} />
      <div className={styles.content}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div className={styles.name}>{name}</div>
          <span className={styles.distance}>
            {Math.round(distance.distance)} {distance.units}
          </span>
        </div>
        <div className={styles.meta}>
          <span className={styles.date}>{dateRange}</span>
          <span className={styles.dot} />
          <span className={styles.entrantsCount}>
            <PeopleIcon style={{ fontSize: "16pt" }} />
            {entrantCount}
          </span>
        </div>
      </div>
      <div className={clsx(styles.countdownOverlay, isLive && styles.happeningNow)}>
        <span className={styles.countdown}>{countdown}</span>
      </div>
    </A>
  );
};

export const TournamentsNearMe = ({ locationInfo }: { locationInfo: UserLocationInfo }) => {
  const [initialUnits] = useState<"km" | "mi">(() => loadStoredValue(STORAGE_KEY_UNITS, "km"));
  const [initialRadius] = useState<DistanceValue>(() => loadStoredValue(STORAGE_KEY_RADIUS, 100));
  const [initialSort] = useState<SortOption>(() => loadStoredValue(STORAGE_KEY_SORT, "date"));

  const [radius, setRadius] = useState<DistanceValue>(initialRadius);
  const [units, setUnits] = useState<UnitValue>(initialUnits);
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);

  const sortOptions = [
    { value: "date", label: Messages.sortByDate() },
    { value: "distance", label: Messages.sortByDistance() },
    { value: "entrants", label: Messages.sortByEntrants() },
  ] as const;

  const radiusInKm = useMemo(() => {
    if (units === "mi") {
      return Math.round(radius / KM_TO_MILE);
    }
    return radius;
  }, [radius, units]);

  const geoLocationQuery = useQuery(
    ["geoLocationQuery", radiusInKm],
    async () => {
      if (!localStorage.getItem(STORAGE_KEY_UNITS)) {
        const defaultUnits: "km" | "mi" = ["US", "GB"].includes(locationInfo.countryCode) ? "mi" : "km";
        setUnits(defaultUnits);
        storeValue(STORAGE_KEY_UNITS, defaultUnits);
      }

      if (!localStorage.getItem(STORAGE_KEY_RADIUS)) {
        setRadius(100);
        storeValue(STORAGE_KEY_RADIUS, 100);
      }

      const events = await window.electron.fetch.fetchNearestTournaments(
        {
          lat: locationInfo.lat,
          lng: locationInfo.lon,
        },
        radiusInKm,
      );
      return { events };
    },
    { staleTime: 5 * 60 * 1000, enabled: !!radius },
  );

  useEffect(() => {
    storeValue(STORAGE_KEY_RADIUS, radius);
  }, [radius]);

  useEffect(() => {
    storeValue(STORAGE_KEY_UNITS, units);
  }, [units]);

  useEffect(() => {
    storeValue(STORAGE_KEY_SORT, sortBy);
  }, [sortBy]);

  const convertDistance = (distanceKm: number): { distance: number; units: "km" | "mi" } => {
    if (units === "mi") {
      return { distance: distanceKm * KM_TO_MILE, units: "mi" };
    }
    return { distance: distanceKm, units: "km" };
  };

  const sortedEvents = useMemo(() => {
    if (!geoLocationQuery.data) {
      return [];
    }
    const events = [...geoLocationQuery.data.events];
    if (sortBy === "distance") {
      events.sort((a, b) => {
        const dist = a.distanceToVenueKm - b.distanceToVenueKm;
        if (Math.abs(dist) > 1e-6) {
          return dist;
        } // avoid float noise

        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return dateA - dateB;
      });
    } else if (sortBy === "date") {
      events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    } else if (sortBy === "entrants") {
      events.sort((a, b) => b.attendees - a.attendees);
    }

    return events;
  }, [geoLocationQuery.data, sortBy]);

  const content = () => {
    if (geoLocationQuery.isLoading) {
      return <div className={styles.loading}>{Messages.loading()}</div>;
    }

    if (geoLocationQuery.error instanceof Error) {
      return <div className={styles.errorMessage}>{Messages.error(geoLocationQuery.error.message)}</div>;
    }

    return (
      <>
        <div className={styles.eventsCount}>
          {Messages.foundTournamentsNearby(
            geoLocationQuery.data?.events.length ?? 0,
            locationInfo.city,
            locationInfo.regionName,
          )}
        </div>
        <div className={styles.cardList}>
          {sortedEvents.map((event, index) => {
            const distance = convertDistance(event.distanceToVenueKm);
            return (
              <NearbyTournamentCard
                key={index}
                name={event.name}
                url={event.url}
                imageSrc={event.imageSrc}
                startDate={event.startDate}
                endDate={event.endDate}
                timezone={event.timezone}
                distance={distance}
                entrantCount={event.attendees}
              />
            );
          })}
        </div>
        <div className={styles.action}>
          <Button
            color="secondary"
            size="large"
            type="button"
            variant="contained"
            LinkComponent={ExternalLink}
            href={`http://smash-map.com/map?lat=${locationInfo.lat}&lng=${locationInfo.lon}&zoom=12`}
            className={styles.actionButton}
          >
            {Messages.exploreEventsMap()}
          </Button>
        </div>
      </>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <DistanceUnitSelect distance={radius} unit={units} onDistanceChange={setRadius} onUnitChange={setUnits} />
        <Select value={sortBy} options={sortOptions} onChange={setSortBy} />
      </div>
      {content()}
    </div>
  );
};
