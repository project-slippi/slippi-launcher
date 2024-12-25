import { css } from "@emotion/react";
import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useState } from "react";

import { ExternalLink as A } from "@/components/external_link";
import spifShopImage from "@/styles/images/ads/spif-slippi-shop-full-size.png";

const getActiveCampaign = () => {
  const now = new Date();
  const start = new Date("2024-12-25");
  const end = new Date("2025-01-12");

  if (now >= start && now <= end) {
    return { image: spifShopImage, seenKey: "SPIF_SHOP_SEEN" };
  }

  return undefined;
};

export const AdDialog = () => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const campaign = getActiveCampaign();

  const [modalOpen, setModalOpen] = useState(Boolean(campaign));

  const defaultSeen = campaign && localStorage.getItem(campaign.seenKey) === "true";
  const [seenNotice, setSeenNotice] = useState(defaultSeen);

  const closeModal = () => {
    if (campaign) {
      localStorage.setItem(campaign.seenKey, "true");
      setSeenNotice(true);
    }
    setModalOpen(false);
  };

  if (!campaign || seenNotice) {
    return null;
  }

  return (
    <Dialog open={modalOpen} onClose={closeModal} fullWidth={true} fullScreen={fullScreen}>
      <IconButton
        aria-label="close"
        onClick={closeModal}
        sx={(theme) => ({
          position: "absolute",
          right: 8,
          top: 8,
          color: theme.palette.grey[500],
        })}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent
        css={css`
          padding-left: 60px;
          padding-right: 60px;
        `}
      >
        <A
          href="https://spif.space/pages/spif-x-slippi"
          css={css`
            display: inline-block;
          `}
        >
          <img
            src={campaign.image}
            alt="Spif Shop"
            css={css`
              width: 100%;
              height: auto;
              margin: -10px 0;
              border-radius: 5px;
            `}
          />
        </A>
      </DialogContent>
    </Dialog>
  );
};
