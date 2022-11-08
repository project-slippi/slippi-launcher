import { css } from "@emotion/react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import React from "react";

import { ExternalLink as A } from "@/components/ExternalLink";

const OBS_WEBSOCKET_NOTICE_KEY = "SEEN_OBS_WEBSOCKET_NOTICE";

export const OBSWebsocketNotice = () => {
  const [seenNotice, setSeenNotice] = React.useState<boolean>(
    localStorage.getItem(OBS_WEBSOCKET_NOTICE_KEY) === "true",
  );
  const onClose = () => {
    localStorage.setItem(OBS_WEBSOCKET_NOTICE_KEY, "true");
    setSeenNotice(true);
  };

  if (seenNotice) {
    return null;
  }

  return (
    <Dialog open={!seenNotice} closeAfterTransition={true} onClose={onClose}>
      <DialogTitle>OBS Websocket 5.0 Update</DialogTitle>
      <DialogContent>
        <div
          css={css`
            a {
              text-decoration: underline;
            }
          `}
        >
          <p>
            Slippi Launcher now supports OBS Websocket 5.0+ which comes standard in OBS 28+, but no longer supports
            version 4.9.1.
          </p>
          <p>
            If you are still on OBS 27, install{" "}
            <A href="https://github.com/obsproject/obs-websocket/releases/tag/5.0.1">OBS Websocket 5.0.1</A>. You can
            install the 5.0 and 4.9-compat versions at the same time if needed.
          </p>
          <p>
            You will also need to update your console connection settings if you use the Autoswitcher because the OBS IP
            and port are now separate fields in the settings.
          </p>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
};
