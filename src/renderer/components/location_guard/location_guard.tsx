import LocationOnIcon from "@mui/icons-material/LocationOn";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { type UserLocationInfo } from "main/fetch_cross_origin/ip_api";
import React from "react";
import { useQuery } from "react-query";

import { useEnableLocationAccess } from "@/lib/hooks/use_settings";

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
  const { data, isLoading, error } = useQuery(
    ["geoLocationQuery"],
    async () => await window.electron.fetch.fetchCurrentLocation(),
    { staleTime: 5 * 60 * 1000 },
  );

  if (isLoading || !data) {
    return null;
  }

  if (error instanceof Error) {
    return <div>{Messages.error(error.message)}</div>;
  }

  return <>{render(data)}</>;
};
