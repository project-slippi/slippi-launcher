import LocationOnIcon from "@mui/icons-material/LocationOn";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { type UserLocationInfo } from "main/fetch_cross_origin/ip_api";
import React from "react";

import { useAppStore } from "@/lib/hooks/use_app_store";
import { useEnableLocationAccess } from "@/lib/hooks/use_settings";
import { useServices } from "@/services";

import { LocationGuardMessages as Messages } from "./location_guard.messages";
import styles from "./location_guard.module.css";

export const LocationNotice = () => {
  const [_enableLocationAccess, setEnableLocationAccess] = useEnableLocationAccess();
  return (
    <div className={styles.container}>
      <LocationOnIcon className={styles.icon} />
      <h2 className={styles.title}>{Messages.title()}</h2>
      <Typography variant="body2" className={styles.description}>
        {Messages.description()}
      </Typography>
      <Typography variant="caption" className={styles.privacy}>
        {Messages.privacyDisclosure()}
      </Typography>
      <Button type="button" color="primary" variant="contained" onClick={() => setEnableLocationAccess(true)}>
        {Messages.allow()}
      </Button>
    </div>
  );
};

export const LocationGuard = ({
  fallback,
  render,
}: {
  fallback?: React.ReactNode;
  render: (locationInfo: UserLocationInfo) => React.ReactNode;
}) => {
  const [enableLocationAccess] = useEnableLocationAccess();
  if (!enableLocationAccess) {
    return fallback ?? null;
  }

  return <LocationGuardImpl render={render} />;
};

const LocationGuardImpl = ({ render }: { render: (locationInfo: UserLocationInfo) => React.ReactNode }) => {
  const currentLanguage = useAppStore((state) => state.currentLanguage);
  const { contentManagementService } = useServices();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["geoLocationQuery", currentLanguage],
    queryFn: async () => await contentManagementService.fetchCurrentLocation(currentLanguage),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className={styles.container}>
        <CircularProgress color="inherit" />
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div className={styles.container}>
        <p>{Messages.error(error.message)}</p>
        <Button color="secondary" onClick={() => refetch()} disabled={isFetching}>
          {Messages.retry()}
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return <>{render(data)}</>;
};
