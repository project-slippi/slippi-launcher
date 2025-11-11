import { NatType } from "@common/types";
import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import * as stylex from "@stylexjs/stylex";
import React from "react";

import { NetworkDiagnosticsResultMessages as Messages } from "./network_diagnostics_result.messages";

const hiddenIpAddress = "···.···.···.···";

const styles = stylex.create({
  button: {
    marginLeft: "8px",
    width: "96px",
  },
  ipAddress: {
    padding: "4px 8px",
    borderRadius: "10px",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    fontSize: "1em",
    margin: "8px 0",
  },
  body: {
    marginBottom: "1em",
  },
});

const getIpAddressTitle = (natType: NatType) => {
  if (natType === NatType.FAILED) {
    return Messages.failedToDetermineIpAddress();
  }
  return Messages.externalIpAddress();
};

type NatTypeSectionProps = {
  address: string;
  description: string;
  natType: NatType;
  title: string;
};
export const NatTypeSection = ({ address, description, natType, title }: NatTypeSectionProps) => {
  const ipAddressTitle = getIpAddressTitle(natType);
  const [ipAddressCopied, setIpAddressCopied] = React.useState(false);
  const onIpAddressCopy = React.useCallback(() => {
    navigator.clipboard
      .writeText(address)
      .then(() => {
        setIpAddressCopied(true);
        window.setTimeout(() => setIpAddressCopied(false), 2000);
      })
      .catch(console.error);
  }, [address]);
  const [ipAddressHidden, setIpAddressHidden] = React.useState(true);
  const onIpAddressShowHide = () => {
    setIpAddressHidden(!ipAddressHidden);
  };
  return (
    <div>
      <Typography variant="subtitle2">{ipAddressTitle}</Typography>
      {natType !== NatType.FAILED && (
        <div {...stylex.props(styles.body)}>
          <InputBase
            disabled={true}
            value={ipAddressHidden ? hiddenIpAddress : address}
            {...stylex.props(styles.ipAddress)}
          />
          <Button variant="contained" color="secondary" onClick={onIpAddressShowHide} {...stylex.props(styles.button)}>
            {ipAddressHidden ? Messages.reveal() : Messages.hide()}
          </Button>
          <Button variant="contained" color="secondary" onClick={onIpAddressCopy} {...stylex.props(styles.button)}>
            {ipAddressCopied ? Messages.copied() : Messages.copy()}
          </Button>
        </div>
      )}
      <Typography variant="subtitle2">{title}</Typography>
      <div {...stylex.props(styles.body)}>{description}</div>
    </div>
  );
};
