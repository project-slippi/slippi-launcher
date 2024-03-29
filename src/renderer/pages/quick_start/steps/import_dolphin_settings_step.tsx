import { DolphinLaunchType } from "@dolphin/types";
import { css } from "@emotion/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import FormHelperText from "@mui/material/FormHelperText";
import React from "react";
import { Controller, useForm } from "react-hook-form";

import { Checkbox } from "@/components/form/checkbox";
import { PathInput } from "@/components/path_input";
import { useDolphinActions } from "@/lib/dolphin/use_dolphin_actions";
import { useDesktopApp } from "@/lib/hooks/use_quick_start";
import { useToasts } from "@/lib/hooks/use_toasts";
import { useServices } from "@/services";

import { QuickStartHeader } from "../quick_start_header/quick_start_header";

const isMac = window.electron.bootstrap.isMac;

type FormValues = {
  netplayPath: string;
  shouldImportPlayback: boolean;
  shouldImportNetplay: boolean;
};

export const ImportDolphinSettingsStep = React.memo(() => {
  const setExists = useDesktopApp((store) => store.setExists);
  const desktopAppDolphinPath = useDesktopApp((store) => store.dolphinPath);
  const { showError } = useToasts();
  const { dolphinService } = useServices();
  const { importDolphin } = useDolphinActions(dolphinService);

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

  const onFormSubmit = handleSubmit((values) => {
    migrateDolphin(values).catch(showError);
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
                onClick={() => finishMigration().catch(showError)}
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
});
