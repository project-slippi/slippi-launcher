import { NatType } from "@common/types";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import React from "react";

const buttonStyle = { marginLeft: "8px", width: "96px" };
const hiddenIpAddress = "···.···.···.···";
const inputBaseCss = css`
  padding: 4px 8px;
  border-radius: 10px;
  background-color: rgba(0, 0, 0, 0.4);
  font-size: 1em;
  margin: 8px 0;
`;

const DialogBody = styled.div`
  margin-bottom: 1em;
`;

const getIpAddressTitle = (natType: NatType) => {
  if (natType === NatType.FAILED) {
    return "Failed to determine IP Address";
  }
  return "External IP Address";
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
    window.electron.clipboard.writeText(address);
    setIpAddressCopied(true);
    window.setTimeout(() => setIpAddressCopied(false), 2000);
  }, [address]);
  const [ipAddressHidden, setIpAddressHidden] = React.useState(true);
  const onIpAddressShowHide = () => {
    setIpAddressHidden(!ipAddressHidden);
  };
  return (
    <div>
      <Typography variant="subtitle2">{ipAddressTitle}</Typography>
      {natType !== NatType.FAILED && (
        <DialogBody>
          <InputBase css={inputBaseCss} disabled={true} value={ipAddressHidden ? hiddenIpAddress : address} />
          <Button variant="contained" color="secondary" onClick={onIpAddressShowHide} style={buttonStyle}>
            {ipAddressHidden ? "Reveal" : "Hide"}
          </Button>
          <Button variant="contained" color="secondary" onClick={onIpAddressCopy} style={buttonStyle}>
            {ipAddressCopied ? "Copied!" : "Copy"}
          </Button>
        </DialogBody>
      )}
      <Typography variant="subtitle2">{title}</Typography>
      <DialogBody>{description}</DialogBody>
    </div>
  );
};
