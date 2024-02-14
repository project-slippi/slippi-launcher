import { Button } from "@mui/material";
import * as stylex from "@stylexjs/stylex";
import React from "react";

import { ExternalLink } from "@/components/external_link";
import shopImage from "@/styles/images/shop-image.png";

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
    top: "160px",
    left: "40px",
    width: "220px !important",
  },
  closeDate: {
    position: "absolute",
    top: "210px",
    left: "75px",
    width: "100%",
    color: "white",
    fontSize: "16px",
  },
});

export const SlippiStore = React.memo(function SlippiStore() {
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
        >
          Click to Shop
        </Button>
      </div>
      <div {...stylex.props(styles.closeDate)}>Store Ends: 2/27/24</div>
    </div>
  );
});
