/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import Collapse from "@material-ui/core/Collapse";
import FormHelperText from "@material-ui/core/FormHelperText";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import WarningIcon from "@material-ui/icons/Warning";
import { Ports } from "@slippi/slippi-js";
import { colors } from "common/colors";
import React from "react";
import { Controller, useForm } from "react-hook-form";

import { ExternalLink as A } from "@/components/ExternalLink";
import { Toggle } from "@/components/FormInputs/Toggle";
import { PathInput } from "@/components/PathInput";
import { isValidIpAddress, isValidIpAndPort } from "@/lib/validate";

type FormValues = {
  ipAddress: string;
  port: number;
  folderPath: string;
  isRealTimeMode: boolean;
  obsIP?: string;
  obsSourceName?: string;
  obsPassword?: string;
  enableRelay?: boolean;
};

export interface AddConnectionFormProps {
  defaultValues?: Partial<FormValues>;
  onSubmit: (values: FormValues) => void;
}

export const AddConnectionForm: React.FC<AddConnectionFormProps> = ({ defaultValues, onSubmit }) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const {
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues });
  const folderPath = watch("folderPath");
  const isRealTimeMode = watch("isRealTimeMode");
  const obsIP = watch("obsIP");
  const obsPassword = watch("obsPassword");
  const obsSourceName = watch("obsSourceName");
  const enableRelay = watch("enableRelay");

  const [showAutoswitcher, setShowAutoswitcher] = React.useState(Boolean(obsIP && obsSourceName));

  const onFormSubmit = handleSubmit(onSubmit);

  return (
    <Outer>
      <form className="form" onSubmit={onFormSubmit}>
        <section>
          <Controller
            name="ipAddress"
            control={control}
            defaultValue=""
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="IP Address"
                required={true}
                error={Boolean(error)}
                helperText={error ? error.message : undefined}
              />
            )}
            rules={{ validate: (val) => isValidIpAddress(val) || "Invalid IP address" }}
          />
        </section>

        <section>
          <SettingDescription label="Target Folder">The folder to save SLP files to.</SettingDescription>
          <PathInput
            value={folderPath}
            onSelect={(newPath) => setValue("folderPath", newPath)}
            placeholder="No folder selected"
            options={{
              properties: ["openDirectory"],
            }}
          />
          <FormHelperText error={Boolean(errors?.folderPath)}>{errors?.folderPath?.message}</FormHelperText>
        </section>
        <section>
          <Toggle
            value={Boolean(isRealTimeMode)}
            onChange={(checked) => setValue("isRealTimeMode", checked)}
            label="Enable Real-time Mode"
            description="Prevents delay from accumulating when mirroring. Keep this off unless both the Wii and computer are on a wired LAN connection."
          />
        </section>

        <div
          css={css`
            margin-bottom: 20px;
          `}
        >
          <Button
            size="small"
            onClick={() => setShowAdvanced(!showAdvanced)}
            color="secondary"
            css={css`
              text-transform: initial;
              margin-bottom: 5px;
            `}
          >
            {showAdvanced ? "Hide" : "Show"} advanced options
          </Button>
          <Collapse
            in={showAdvanced}
            css={css`
              padding-left: 20px;
              padding-bottom: 10px;
              border-left: solid 3px ${colors.purpleLight};
            `}
          >
            <Notice>
              <WarningIcon />
              Only modify these values if you know what you're doing.
            </Notice>
            <Toggle
              value={showAutoswitcher}
              onChange={() => setShowAutoswitcher(!showAutoswitcher)}
              label="Enable Autoswitcher"
              description={
                <span
                  css={css`
                    a {
                      text-decoration: underline;
                    }
                  `}
                >
                  Allows automatic hiding and showing of an OBS source (e.g. your Dolphin capture) when the game is
                  active. Requires <A href="https://github.com/Palakis/obs-websocket">OBS Websocket Plugin</A>.
                </span>
              }
            />
            <section>
              <Collapse in={showAutoswitcher}>
                <div
                  css={css`
                    display: grid;
                    grid-gap: 10px;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    margin: 10px 0px 10px;
                  `}
                >
                  <Controller
                    name="obsIP"
                    control={control}
                    defaultValue=""
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        label="OBS Websocket IP:Port"
                        required={showAutoswitcher}
                        error={Boolean(error)}
                        helperText={error ? error.message : undefined}
                      />
                    )}
                    rules={{
                      validate: (val) => {
                        if (!val) {
                          return false;
                        }
                        return isValidIpAndPort(val) || "Invalid IP address";
                      },
                    }}
                  />
                  <TextField
                    label="OBS Password"
                    value={obsPassword ?? ""}
                    onChange={(e) => setValue("obsPassword", e.target.value)}
                    type="password"
                  />
                </div>
                <TextField
                  label="OBS Source Name"
                  value={obsSourceName ?? ""}
                  required={showAutoswitcher}
                  onChange={(e) => setValue("obsSourceName", e.target.value)}
                />
              </Collapse>
            </section>
            <section>
              <Toggle
                value={Boolean(enableRelay)}
                onChange={(checked) => setValue("enableRelay", checked)}
                label="Enable Console Relay"
                description="Allows external programs to read live game data by connecting to a local endpoint."
              />
            </section>
            <section>
              <SettingDescription label="Connection Port">
                The port used for connecting to console. Only change this if connecting to a Console Relay. If unsure,
                leave it as {Ports.DEFAULT}.
              </SettingDescription>
              <Controller
                name="port"
                control={control}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <TextField
                    css={css`
                      input::-webkit-outer-spin-button,
                      input::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                      }
                    `}
                    label="Port"
                    required={true}
                    value={isNaN(value) ? "" : value.toString()}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    error={!!error}
                    helperText={error ? error.message : null}
                    type="number"
                  />
                )}
                rules={{ validate: (val) => !isNaN(val) || "Invalid port number" }}
              />
            </section>
          </Collapse>
        </div>

        <Button type="submit" variant="contained" color="primary">
          Submit
        </Button>
      </form>
    </Outer>
  );
};

const Outer = styled.div`
  form section {
    margin-bottom: 15px;
  }
`;

const SettingDescription: React.FC<{ label: string; className?: string }> = ({ className, label, children }) => {
  return (
    <div
      className={className}
      css={css`
        margin-bottom: 5px;
      `}
    >
      <Typography variant="body1">{label}</Typography>
      <Typography variant="caption">{children}</Typography>
    </div>
  );
};

const Notice = styled.div`
  display: flex;
  align-items: center;
  padding: 5px 10px;
  background-color: rgba(0, 0, 0, 0.3);
  color: #bbb;
  border-radius: 10px;
  svg {
    padding: 5px;
    margin-right: 5px;
  }
  margin-bottom: 20px;
`;
