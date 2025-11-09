import { IsoValidity } from "@common/types";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import Help from "@mui/icons-material/Help";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import React from "react";
import { gte } from "semver";

import { Toggle } from "@/components/form/toggle";
import { PathInput } from "@/components/path_input/path_input";
import { useDolphinStore } from "@/lib/dolphin/use_dolphin_store";
import { useIsoVerification } from "@/lib/hooks/use_iso_verification";
import { useEnableJukebox, useIsoPath, useLaunchMeleeOnPlay } from "@/lib/hooks/use_settings";

import { SettingItem } from "../setting_item_section";
import { GameSettingsMessages as Messages } from "./game_settings.messages";

const isWindows = window.electron.bootstrap.isWindows;

const renderValidityStatus = (isoValidity: IsoValidity) => {
  switch (isoValidity) {
    case IsoValidity.VALID: {
      return <CheckCircleIcon />;
    }
    case IsoValidity.UNKNOWN: {
      return <Help />;
    }
    case IsoValidity.INVALID:
    case IsoValidity.UNVALIDATED: {
      return <ErrorIcon />;
    }
  }
};

const renderValidityText = (isoValidity: IsoValidity) => {
  switch (isoValidity) {
    case IsoValidity.VALID: {
      return Messages.valid();
    }
    case IsoValidity.UNKNOWN: {
      return Messages.unknown();
    }
    case IsoValidity.INVALID:
      return Messages.invalid();
    case IsoValidity.UNVALIDATED: {
      return Messages.unvalidated();
    }
  }
};

export const GameSettings = React.memo(() => {
  const verifying = useIsoVerification((state) => state.isValidating);
  const isoValidity = useIsoVerification((state) => state.validity);
  const [isoPath, setIsoPath] = useIsoPath();
  const [launchMeleeOnPlay, setLaunchMelee] = useLaunchMeleeOnPlay();
  const [enableJukebox, setEnableJukebox] = useEnableJukebox();
  const netplayDolphinOpen = useDolphinStore((store) => store.netplayOpened);
  const playbackDolphinOpen = useDolphinStore((store) => store.playbackOpened);

  const dolphinVersion = useDolphinStore((store) => store.netplayDolphinVersion);

  const showJukeboxToggle = dolphinVersion !== null && gte(dolphinVersion, "3.2.0");

  const onLaunchMeleeChange = async (value: string) => {
    const launchMelee = value === "true";
    await setLaunchMelee(launchMelee);
  };

  return (
    <div>
      <SettingItem name={Messages.meleeIsoFile()} description={Messages.meleeIsoFileDescription()}>
        <PathInput
          tooltipText={netplayDolphinOpen || playbackDolphinOpen ? Messages.closeDolphinToChange() : ""}
          value={isoPath !== null ? isoPath : ""}
          onSelect={setIsoPath}
          placeholder={Messages.noFileSet()}
          disabled={verifying || netplayDolphinOpen || playbackDolphinOpen}
          options={{
            filters: [{ name: "Melee ISO", extensions: ["iso", "gcm", "gcz", "ciso"] }],
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
                {verifying ? Messages.verifying() : renderValidityText(isoValidity)}
              </span>
              {verifying ? <CircularProgress size={25} color="inherit" /> : renderValidityStatus(isoValidity)}
            </ValidationContainer>
          }
        />
      </SettingItem>
      <SettingItem name={Messages.playButtonAction()} description={Messages.playButtonActionDescription()}>
        <RadioGroup value={launchMeleeOnPlay} onChange={(_event, value) => onLaunchMeleeChange(value)}>
          <FormControlLabel value={true} label={Messages.launchMelee()} control={<Radio />} />
          <FormControlLabel value={false} label={Messages.launchDolphin()} control={<Radio />} />
        </RadioGroup>
      </SettingItem>
      {showJukeboxToggle && (
        <SettingItem name="">
          <Toggle
            value={enableJukebox}
            onChange={(checked) => setEnableJukebox(checked)}
            label={Messages.enableMusic()}
            description={Messages.enableMusicDescription() + (isWindows ? " " + Messages.incompatibleWithWasapi() : "")}
            disabled={netplayDolphinOpen}
          />
        </SettingItem>
      )}
    </div>
  );
});

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
