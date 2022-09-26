import { colors } from "@common/colors";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import WarningIcon from "@mui/icons-material/Warning";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import FormHelperText from "@mui/material/FormHelperText";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Ports } from "@slippi/slippi-js";
import React from "react";
import { Controller, useForm } from "react-hook-form";

import { ExternalLink as A } from "@/components/ExternalLink";
import { Checkbox } from "@/components/FormInputs/Checkbox";
import { Toggle } from "@/components/FormInputs/Toggle";
import { PathInput } from "@/components/PathInput";
import { isValidIpAddress, isValidPort } from "@/lib/validate";

type FormValues = {
  ipAddress: string;
  port: number;
  folderPath: string;
  isRealtime: boolean;
  enableAutoSwitcher: boolean;
  obsIP?: string;
  obsPort?: string;
  obsSourceName?: string;
  obsPassword?: string;
  enableRelay: boolean;
  useNicknameFolders: boolean;
};

export interface AddConnectionFormProps {
  defaultValues?: Partial<FormValues>;
  onSubmit: (values: FormValues) => void;
  disabled: boolean;
}

export const AddConnectionForm: React.FC<AddConnectionFormProps> = ({ defaultValues, onSubmit, disabled }) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const {
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues });
  const folderPath = watch("folderPath");
  const isRealtime = watch("isRealtime");
  const enableAutoSwitcher = watch("enableAutoSwitcher");
  const obsPassword = watch("obsPassword");
  const obsSourceName = watch("obsSourceName");
  const enableRelay = watch("enableRelay");
  const useNicknameFolders = watch("useNicknameFolders");

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
                disabled={disabled}
              />
            )}
            rules={{ validate: (val) => isValidIpAddress(val) }}
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
            disabled={disabled}
          />
          <FormHelperText error={Boolean(errors?.folderPath)}>{errors?.folderPath?.message}</FormHelperText>
          <Checkbox
            onChange={() => setValue("useNicknameFolders", !useNicknameFolders)}
            checked={useNicknameFolders}
            disabled={disabled}
            label={<CheckboxDescription>Save replays to subfolders based on console nickname</CheckboxDescription>}
          />
        </section>
        <section>
          <Toggle
            value={Boolean(isRealtime)}
            onChange={(checked) => setValue("isRealtime", checked)}
            label="Enable Real-time Mode"
            description="Prevents delay from accumulating when mirroring. Keep this off unless both the Wii and computer are on a wired LAN connection."
            disabled={disabled}
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
              value={enableAutoSwitcher}
              onChange={(checked) => {
                setValue("enableAutoSwitcher", checked);
              }}
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
                  active. Requires <A href="https://github.com/obsproject/obs-websocket/releases">OBS Websocket 5.0+</A>
                  , which comes preinstalled on OBS 28+.
                </span>
              }
              disabled={disabled}
            />
            <section>
              <Collapse in={enableAutoSwitcher}>
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
                        label="OBS Websocket IP"
                        required={enableAutoSwitcher}
                        error={Boolean(error)}
                        helperText={error ? error.message : undefined}
                        disabled={disabled}
                      />
                    )}
                    rules={{
                      required: enableAutoSwitcher,
                      validate: (val) => {
                        if (!enableAutoSwitcher) {
                          return true;
                        }
                        if (!val) {
                          return false;
                        }
                        return isValidIpAddress(val);
                      },
                    }}
                  />
                  <Controller
                    name="obsPort"
                    control={control}
                    defaultValue=""
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        label="OBS Websocket Port"
                        required={enableAutoSwitcher}
                        error={Boolean(error)}
                        helperText={error ? error.message : undefined}
                        disabled={disabled}
                      />
                    )}
                    rules={{
                      required: enableAutoSwitcher,
                      validate: (val) => {
                        if (!enableAutoSwitcher) {
                          return true;
                        }
                        if (!val) {
                          return false;
                        }
                        return isValidPort(val) || "Invalid Port";
                      },
                    }}
                  />
                  <TextField
                    label="OBS Password"
                    value={obsPassword ?? ""}
                    onChange={(e) => setValue("obsPassword", e.target.value)}
                    type="password"
                    disabled={disabled}
                  />
                  <TextField
                    label="OBS Source Name"
                    value={obsSourceName ?? ""}
                    required={enableAutoSwitcher}
                    onChange={(e) => setValue("obsSourceName", e.target.value)}
                    disabled={disabled}
                  />
                </div>
              </Collapse>
            </section>
            <section>
              <Toggle
                value={Boolean(enableRelay)}
                onChange={(checked) => setValue("enableRelay", checked)}
                label="Enable Console Relay"
                description="Allows external programs to read live game data by connecting to a local endpoint."
                disabled={disabled}
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
                    error={Boolean(error)}
                    helperText={error ? error.message : null}
                    type="number"
                    disabled={disabled}
                  />
                )}
                rules={{ validate: (val) => !isNaN(val) || "Invalid port number" }}
              />
            </section>
          </Collapse>
        </div>

        <Button type="submit" variant="contained" color="primary" disabled={disabled}>
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

const CheckboxDescription = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.palette.text.disabled};
`;
