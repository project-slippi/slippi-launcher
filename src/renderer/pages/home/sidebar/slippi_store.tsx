import { Button, Typography } from "@mui/material";
import * as stylex from "@stylexjs/stylex";
import { formatDuration, intervalToDuration, isBefore } from "date-fns";
import React from "react";

import { ExternalLink } from "@/components/external_link";
import { shortEnLocale } from "@/lib/time";
import shopImage from "@/styles/images/shop-image.png";

const SHOP_CLOSES_AT = new Date("2024-02-28T08:00:00.000Z");

const styles = stylex.create({
  container: {
    position: "relative",
    flex: "1",
    overflow: "hidden",
    backgroundColor: "#21ba44",
  },
  image: {
    position: "absolute",
    width: "100%",
    objectFit: "cover",
  },
  buttonContainer: {
    position: "absolute",
    top: "150px",
    left: "40px",
    width: "220px !important",
  },
  closeDate: {
    position: "absolute",
    fontWeight: "bold",
    top: "200px",
    width: "100%",
    color: "white",
    fontSize: 15,
    textAlign: "center",
  },
});

const InternalSlippiStore = React.memo(function InternalSlippiStore({
  shopOpen,
  countdown,
}: {
  shopOpen: boolean;
  countdown: string;
}) {
  const buttonText = shopOpen ? "Click to Shop" : "Shop closed";
  return (
    <div {...stylex.props(styles.container)}>
      <img src={shopImage} {...stylex.props(styles.image)} />
      <div {...stylex.props(styles.buttonContainer)}>
        <Button
          variant="contained"
          sx={{ color: "white", textTransform: "uppercase" }}
          color="secondary"
          fullWidth={true}
          LinkComponent={ExternalLink}
          href="https://start.gg/slippi/shop"
          disabled={!shopOpen}
        >
          {buttonText}
        </Button>
      </div>
      {countdown && (
        <div {...stylex.props(styles.closeDate)}>
          <Typography variant="overline" sx={{ lineHeight: "initial" }}>
            Shop closes in
          </Typography>
          <Typography fontWeight="bold">{countdown}</Typography>
        </div>
      )}
    </div>
  );
});

export const SlippiStore = React.memo(function SlippiStore() {
  const [shopOpen, setShopOpen] = React.useState(true);
  const [countdown, setCountdown] = React.useState<string>("");

  React.useEffect(() => {
    const endDate = SHOP_CLOSES_AT;
    const interval = setInterval(() => {
      const now = new Date();
      const duration = intervalToDuration({ start: now, end: endDate });

      if (isBefore(endDate, now)) {
        setShopOpen(false);
        setCountdown("");
        clearInterval(interval);
      } else {
        setCountdown(formatDuration(duration, { locale: shortEnLocale }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <InternalSlippiStore shopOpen={shopOpen} countdown={countdown} />;
});
