import { Ports } from "@console/types";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import WarningIcon from "@mui/icons-material/Warning";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import FormHelperText from "@mui/material/FormHelperText";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React from "react";
import { Controller, useForm } from "react-hook-form";

import { ExternalLink as A } from "@/components/external_link";
import { Checkbox } from "@/components/form/checkbox";
import { Toggle } from "@/components/form/toggle";
import { PathInput } from "@/components/path_input/path_input";
import { isValidIpAddress, isValidPort } from "@/lib/validate/validate";
import { colors } from "@/styles/colors";

import { AddConnectionFormMessages as Messages } from "./add_connection_form.messages";

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

type AddConnectionFormProps = {
  defaultValues?: Partial<FormValues>;
  onSubmit: (values: FormValues) => void;
  disabled: boolean;
};

export const AddConnectionForm = ({ defaultValues, onSubmit, disabled }: AddConnectionFormProps) => {
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
                label={Messages.ipAddress()}
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
          <SettingDescription label={Messages.targetFolder()}>{Messages.targetFolderDescription()}</SettingDescription>
          <PathInput
            value={folderPath}
            onSelect={(newPath) => setValue("folderPath", newPath)}
            placeholder={Messages.targetFolderPlaceholder()}
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
            label={<CheckboxDescription>{Messages.saveReplaysToSubfolders()}</CheckboxDescription>}
          />
        </section>
        <section>
          <Toggle
            value={Boolean(isRealtime)}
            onChange={(checked) => setValue("isRealtime", checked)}
            label={Messages.enableRealTimeMode()}
            description={Messages.enableRealTimeModeDescription()}
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
            {showAdvanced ? Messages.hideAdvancedOptions() : Messages.showAdvancedOptions()}
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
              {Messages.onlyModifyIfYouKnowWhatYouAreDoing()}
            </Notice>
            <Toggle
              value={enableAutoSwitcher}
              onChange={(checked) => {
                setValue("enableAutoSwitcher", checked);
              }}
              label={Messages.enableAutoswitcher()}
              description={
                <span
                  css={css`
                    a {
                      text-decoration: underline;
                    }
                  `}
                >
                  {Messages.enableAutoswitcherDescription()}{" "}
                  <A href="https://github.com/obsproject/obs-websocket/releases">{Messages.download()}</A>
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
                        label={Messages.obsWebsocketIP()}
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
                        label={Messages.obsWebsocketPort()}
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
                        return isValidPort(val) || Messages.invalidPort();
                      },
                    }}
                  />
                  <TextField
                    label={Messages.obsPassword()}
                    value={obsPassword ?? ""}
                    onChange={(e) => setValue("obsPassword", e.target.value)}
                    type="password"
                    disabled={disabled}
                  />
                  <TextField
                    label={Messages.obsSourceName()}
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
                label={Messages.enableRelay()}
                description={Messages.enableRelayDescription()}
                disabled={disabled}
              />
            </section>
            <section>
              <SettingDescription label={Messages.connectionPort()}>
                {Messages.connectionPortDescription(Ports.DEFAULT)}
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
                    label={Messages.port()}
                    required={true}
                    value={isNaN(value) ? "" : value.toString()}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    error={Boolean(error)}
                    helperText={error?.message}
                    type="number"
                    disabled={disabled}
                  />
                )}
                rules={{ validate: (val) => !isNaN(val) || Messages.invalidPortNumber() }}
              />
            </section>
          </Collapse>
        </div>

        <Button type="submit" variant="contained" color="primary" disabled={disabled}>
          {Messages.submit()}
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

const SettingDescription = ({
  className,
  label,
  children,
}: React.PropsWithChildren<{ label: string; className?: string }>) => {
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
