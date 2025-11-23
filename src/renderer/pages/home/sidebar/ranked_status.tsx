import { Button, Card, Typography } from "@mui/material";
import * as stylex from "@stylexjs/stylex";
import type { Duration } from "date-fns";
import { formatDuration, intervalToDuration } from "date-fns";
import React from "react";

import { ExternalLink } from "@/components/external_link";
import { useAccount } from "@/lib/hooks/use_account";
import { useAppStore } from "@/lib/hooks/use_app_store";
import { getLocale, shortEnLocale } from "@/lib/time";
import type { SupportedLanguage } from "@/services/i18n/util";
import { ReactComponent as RankedDayActiveIcon } from "@/styles/images/ranked_day_active.svg";
import { ReactComponent as RankedDayInactiveIcon } from "@/styles/images/ranked_day_inactive.svg";
import { colors } from "@/styles/tokens.stylex";

import { RankedStatusMessages as Messages } from "./ranked_status.messages";

const userLocale = window.electron.bootstrap.locale;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const FREE_ACCESS_START_AT = new Date(Date.UTC(2024, 3, 15, 14, 0, 0)); // Note: Month is 0-indexed, so 3 is April
const FREE_ACCESS_OFFSET_FROM = new Date(Date.UTC(2024, 3, 15, 8, 0, 0)); // Note: Month is 0-indexed, so 3 is April

const styles = stylex.create({
  card: {
    margin: "6px",
    padding: "10px",
  },
  centerStack: {
    display: "grid",
    justifyContent: "center",
    justifyItems: "center",
    alignItems: "center",
  },
  stroke: {
    textTransform: "uppercase",
    textShadow:
      "-2px -2px 0 #231232, 0 -2px 0 #231232, 2px -2px 0 #231232, 2px 0 0 #231232, 2px 2px 0 #231232, 0 2px 0 #231232, -2px 2px 0 #231232, -2px 0 0 #231232",
  },
  separator: {
    width: "50%",
    height: "2px",
    backgroundColor: "#D9D9D919",
    margin: "12px 25%",
  },
  buttonContainer: {
    margin: "16px 0 4px 0",
  },
});

const getFullAccessTimes = (now: Date): { isActive: boolean; nextStartTime: Date; nextEndTime: Date } => {
  const startTime = FREE_ACCESS_START_AT;
  const offsetTime = FREE_ACCESS_OFFSET_FROM;
  if (now < startTime) {
    return { isActive: false, nextStartTime: startTime, nextEndTime: new Date(offsetTime.getTime() + MS_PER_DAY) };
  }

  const daysSinceStart = Math.floor((now.getTime() - offsetTime.getTime()) / MS_PER_DAY);
  let daysUntilNextRankedDay = 4 - (daysSinceStart % 4);
  if (daysUntilNextRankedDay === 4) {
    daysUntilNextRankedDay = 0;
  }
  const nextRankedDayTime = new Date(offsetTime.getTime() + (daysSinceStart + daysUntilNextRankedDay) * MS_PER_DAY);

  return {
    isActive: daysUntilNextRankedDay === 0,
    nextStartTime: nextRankedDayTime,
    nextEndTime: new Date(nextRankedDayTime.getTime() + MS_PER_DAY),
  };
};

const convertCodeToSlug = (code: string | undefined) => {
  if (code) {
    return code.toLowerCase().replace("#", "-");
  }
  return "";
};

const InternalRankedStatus = ({
  isFullAccess,
  countdown,
  nextTime,
}: {
  isFullAccess: boolean;
  countdown: string;
  nextTime: Date;
}) => {
  const currentLanguage = useAppStore((store) => store.currentLanguage);
  const userData = useAccount((store) => store.userData);
  const connectCode = userData?.playKey?.connectCode;

  return (
    <Card {...stylex.props(styles.card)}>
      <div {...stylex.props(styles.centerStack)}>
        <Typography
          variant="h6"
          color={colors.purpleLight}
          fontSize="14px"
          fontWeight="semibold"
          marginBottom="8px"
          textTransform="uppercase"
        >
          {Messages.rankedDay()}
        </Typography>
        {isFullAccess ? <RankedDayActiveIcon width={40} /> : <RankedDayInactiveIcon width={40} />}
        <Typography
          {...stylex.props(styles.stroke)}
          variant="body1"
          color={isFullAccess ? colors.greenDark : colors.textDim}
          fontSize="20px"
          fontWeight="medium"
        >
          {isFullAccess ? Messages.active() : Messages.startingSoon()}
        </Typography>
      </div>
      <div {...stylex.props(styles.separator)} />
      <div {...stylex.props(styles.centerStack)}>
        <Typography
          variant="h6"
          color={colors.purpleLight}
          className="14px"
          fontSize="14px"
          fontWeight="semibold"
          marginBottom="4px"
          textTransform="uppercase"
        >
          {isFullAccess ? Messages.endingIn() : Messages.startingIn()}
        </Typography>
        <Typography fontWeight="medium" fontSize="20px">
          {countdown}
        </Typography>
        <Typography fontSize="12px" color={colors.textDim} marginTop="-4px">
          {nextTime.toLocaleString([userLocale, currentLanguage], {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            // timeZoneName: "short", // Chose not to include this. Can sometimes confuse Europeans (happened at smashgg)
          })}
        </Typography>
      </div>
      <Typography fontSize="11px" color={colors.textDim} marginTop="12px">
        {isFullAccess ? Messages.rankedPlayIsCurrentlyAvailable() : Messages.onceEveryFourDaysRankedPlayIsAvailable()}
      </Typography>
      <div {...stylex.props(styles.buttonContainer)}>
        <Button
          variant="contained"
          sx={{ color: "white", fontSize: "13px", fontWeight: "medium", textTransform: "uppercase" }}
          color="secondary"
          fullWidth={true}
          LinkComponent={ExternalLink}
          href={`https://slippi.gg/user/${convertCodeToSlug(connectCode)}`}
          disabled={!connectCode}
        >
          {Messages.viewRankedProfile()}
        </Button>
      </div>
    </Card>
  );
};

export const RankedStatus = React.memo(function RankedStatus() {
  const [isFullAccess, setFullAccess] = React.useState(false);
  const [countdown, setCountdown] = React.useState<string>("");
  const [nextTime, setNextTime] = React.useState<Date>(new Date());
  const currentLanguage = useAppStore((store) => store.currentLanguage);

  React.useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      // // TODO: Comment this test code. Used to look at different state.
      // now = new Date(now.getTime() + 24 * 60 * 60 * 1000 * 3);
      const fullAccess = getFullAccessTimes(now);

      const nextTime = fullAccess.isActive ? fullAccess.nextEndTime : fullAccess.nextStartTime;
      const duration = intervalToDuration({ start: now, end: nextTime });

      setNextTime(nextTime);
      setFullAccess(fullAccess.isActive);

      const format: (keyof Duration)[] =
        (duration.hours ?? 0) < 1 && (duration.days ?? 0) < 1 ? ["minutes", "seconds"] : ["days", "hours", "minutes"];
      setCountdown(
        formatDuration(duration, { format, locale: getLocale(currentLanguage as SupportedLanguage) ?? shortEnLocale }),
      );
    };
    checkTime();

    const interval = window.setInterval(checkTime, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return <InternalRankedStatus isFullAccess={isFullAccess} countdown={countdown} nextTime={nextTime} />;
});
