/** @jsx jsx */
import { isMac } from "@common/constants";
import { DolphinLaunchType } from "@dolphin/types";
import { css, jsx } from "@emotion/react";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Container from "@material-ui/core/Container";
import FormHelperText from "@material-ui/core/FormHelperText";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useToasts } from "react-toast-notifications";

import { Checkbox } from "@/components/FormInputs/Checkbox";
import { PathInput } from "@/components/PathInput";
import { useDolphin } from "@/lib/hooks/useDolphin";
import { useDesktopApp } from "@/lib/hooks/useQuickStart";

import { QuickStartHeader } from "./QuickStartHeader";

type FormValues = {
  netplayPath: string;
  shouldImportPlayback: boolean;
  shouldImportNetplay: boolean;
};

export const ImportDolphinSettingsStep: React.FC = () => {
  const setExists = useDesktopApp((store) => store.setExists);
  const desktopAppDolphinPath = useDesktopApp((store) => store.dolphinPath);
  const { addToast } = useToasts();
  const { importDolphin } = useDolphin();

  const migrateDolphin = async (values: FormValues) => {
    if (values.shouldImportNetplay) {
      importDolphin(values.netplayPath, DolphinLaunchType.NETPLAY);
    }
    if (values.shouldImportPlayback) {
      importDolphin(desktopAppDolphinPath, DolphinLaunchType.PLAYBACK);
    }

    await finishMigration();
  };

  const finishMigration = async () => {
    // delete desktop app path
    await window.electron.common.deleteDesktopAppPath();
    setExists(false);
  };

  const {
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { netplayPath: "", shouldImportNetplay: false, shouldImportPlayback: false },
  });
  const netplayPath = watch("netplayPath");
  const migrateNetplay = watch("shouldImportNetplay");
  const migratePlayback = watch("shouldImportPlayback");

  const handleError = (err: any) => addToast(err.message ?? JSON.stringify(err), { appearance: "error" });

  const onFormSubmit = handleSubmit((values) => {
    migrateDolphin(values).catch(handleError);
  });

  const extension = isMac ? "app" : "exe";
  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <Container>
        <QuickStartHeader>Import old Dolphin settings</QuickStartHeader>
        <div>Which Dolphin settings would you like to import?</div>

        <div
          css={css`
            margin-top: 10px;
            display: flex;
            flex-direction: column;
            & > * {
              margin-top: 5px;
            }
          `}
        >
          <Checkbox
            label="Playback"
            checked={migratePlayback}
            onChange={() => setValue("shouldImportPlayback", !migratePlayback)}
          />
          <Checkbox
            label="Netplay"
            checked={migrateNetplay}
            onChange={() => setValue("shouldImportNetplay", !migrateNetplay)}
          />
        </div>
        <div
          css={css`
            margin-top: 20px;
          `}
        >
          <form className="form" onSubmit={onFormSubmit}>
            {migrateNetplay && (
              <div>
                <div
                  css={css`
                    margin-bottom: 5px;
                  `}
                >
                  Select the Dolphin.{extension} with the desired netplay settings.
                </div>
                <Controller
                  name="netplayPath"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <PathInput
                      {...field}
                      value={netplayPath}
                      onSelect={(newPath) => setValue("netplayPath", newPath)}
                      placeholder="No Netplay Dolphin selected"
                      options={{
                        filters: [{ name: "Slippi Dolphin", extensions: [isMac ? "app" : "exe"] }],
                      }}
                    />
                  )}
                  rules={{ validate: (val) => val.length > 0 || "No path selected" }}
                />
                <div
                  css={css`
                    min-height: 25px;
                  `}
                >
                  <FormHelperText error={Boolean(errors?.netplayPath)}>{errors?.netplayPath?.message}</FormHelperText>
                </div>
              </div>
            )}

            <div
              css={css`
                display: flex;
                flex-direction: column;
                margin-top: 25px;
                margin-left: auto;
                margin-right: auto;
                width: 400px;
              `}
            >
              <Button type="submit" variant="contained" color="primary">
                Import settings
              </Button>
              <Button
                color="secondary"
                onClick={() => finishMigration().catch(handleError)}
                css={css`
                  text-transform: initial;
                  margin-top: 10px;
                `}
              >
                Skip import
              </Button>
            </div>
          </form>
        </div>
      </Container>
    </Box>
  );
};
