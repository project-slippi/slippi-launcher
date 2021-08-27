/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import CircularProgress from "@material-ui/core/CircularProgress";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import ErrorIcon from "@material-ui/icons/Error";
import Help from "@material-ui/icons/Help";
import { IsoValidity } from "common/types";
import React from "react";

import { PathInput } from "@/components/PathInput";
import { useIsoVerification } from "@/lib/hooks/useIsoVerification";
import {
  useIsoPath,
  useLaunchMeleeOnPlay,
  useRootSlpPath,
  useSpectateSlpPath,
  useMonthlySubfolders,
} from "@/lib/hooks/useSettings";
import { SettingItem } from "./SettingItem";

const renderValidityStatus = (isoValidity: IsoValidity) => {
  switch (isoValidity) {
    case IsoValidity.VALID: {
      return <CheckCircleIcon />;
    }
    case IsoValidity.UNKNOWN: {
      return <Help />;
    }
    case IsoValidity.INVALID: {
      return <ErrorIcon />;
    }
  }
};

export const MeleeOptions: React.FC = () => {
  const verifying = useIsoVerification((state) => state.isValidating);
  const isoValidity = useIsoVerification((state) => state.validity);
  const [isoPath, setIsoPath] = useIsoPath();
  const [launchMeleeOnPlay, setLaunchMelee] = useLaunchMeleeOnPlay();
  const [localReplayDir, setLocalReplayDir] = useRootSlpPath();
  const [enableMonthlySubfolders, setUseMonthlySubfolders] = useMonthlySubfolders();
  const [spectateDir, setSpectateDir] = useSpectateSlpPath();

  const onLaunchMeleeChange = async (value: string) => {
    const launchMelee = value === "true";
    await setLaunchMelee(launchMelee);
  };

  const onUseMonthlySubfoldersToggle = async () => {
    await setUseMonthlySubfolders(!enableMonthlySubfolders);
  };

  return (
    <div>
      <SettingItem name="Melee ISO File" description="The path to an NTSC Melee 1.02 ISO.">
        <PathInput
          value={isoPath !== null ? isoPath : ""}
          onSelect={setIsoPath}
          placeholder="No file set"
          disabled={verifying}
          options={{
            filters: [{ name: "Melee ISO", extensions: ["iso", "gcm"] }],
          }}
          endAdornment={
            <ValidationContainer className={verifying ? undefined : isoValidity.toLowerCase()}>
              <span
                css={css`
                  text-transform: capitalize;
                  margin-right: 5px;
                  font-weight: 500;
                `}
              >
                {verifying ? "Verifying..." : isoValidity.toLowerCase()}
              </span>
              {verifying ? <CircularProgress size={25} color="inherit" /> : renderValidityStatus(isoValidity)}
            </ValidationContainer>
          }
        />
      </SettingItem>
      <SettingItem name="Play Button Action" description="Choose what happens when the Play button is pressed.">
        <RadioGroup value={launchMeleeOnPlay} onChange={(_event, value) => onLaunchMeleeChange(value)}>
          <FormControlLabel value={true} label="Launch Melee" control={<Radio />} />
          <FormControlLabel value={false} label="Launch Dolphin" control={<Radio />} />
        </RadioGroup>
      </SettingItem>
      <SettingItem name="Local SLP Directory" description="The folder where your SLP replays should be saved.">
        <PathInput
          value={localReplayDir}
          onSelect={setLocalReplayDir}
          options={{
            properties: ["openDirectory"],
          }}
          placeholder="No folder set"
        />
        <MonthlySubfolders>
          Save replays to monthly subfolders
          <CheckboxDiv>
            <Checkbox onChange={() => onUseMonthlySubfoldersToggle()} checked={enableMonthlySubfolders} />
          </CheckboxDiv>
        </MonthlySubfolders>
      </SettingItem>
      <SettingItem name="Spectator SLP Directory" description="The folder where spectated games should be saved.">
        <PathInput
          value={spectateDir}
          onSelect={setSpectateDir}
          options={{
            properties: ["openDirectory"],
          }}
          placeholder="No folder set"
        />
      </SettingItem>
    </div>
  );
};

const ValidationContainer = styled.div`
  display: flex;
  align-items: center;
  margin-right: 10px;
  color: white;
  &.invalid {
    color: ${({ theme }) => theme.palette.error.main};
  }
  &.valid {
    color: ${({ theme }) => theme.palette.success.main};
  }
`;

const MonthlySubfolders = styled.div`
  margin-top: 4px;
  font-size: 14px;
  color: ${({ theme }) => theme.palette.text.disabled};
`;

const CheckboxDiv = styled.div`
  padding-left: 5px;
  align-items: right;
  display: inline-block;
  height: 50%;
`;
