/** @jsx jsx */
import { ipc_migrateDolphin } from "@dolphin/ipc";
import { css, jsx } from "@emotion/react";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Container from "@material-ui/core/Container";
import FormHelperText from "@material-ui/core/FormHelperText";
import { isMac } from "common/constants";
import React from "react";
import { Controller, useForm } from "react-hook-form";

import { Checkbox } from "@/components/FormInputs/Checkbox";
import { PathInput } from "@/components/PathInput";
import { useDesktopApp } from "@/lib/hooks/useQuickStart";

import { QuickStartHeader } from "./QuickStartHeader";

type FormValues = {
  netplayPath: string;
  shouldImportPlayback: boolean;
  shouldImportNetplay: boolean;
};

export const MigrateDolphinStep: React.FC = () => {
  const setExists = useDesktopApp((store) => store.setExists);

  const migrateDolphin = async (values: FormValues) => {
    await ipc_migrateDolphin.renderer!.trigger({
      migrateNetplay: values.shouldImportNetplay ? values.netplayPath : null,
      migratePlayback: values.shouldImportPlayback,
    });
    setExists(false);
  };

  const skipMigration = async () => {
    await ipc_migrateDolphin.renderer!.trigger({
      migrateNetplay: null,
      migratePlayback: false,
    });
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

  const onFormSubmit = handleSubmit((values) => migrateDolphin(values));

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
                  Select the location of your old Netplay Dolphin app.
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
                        properties: ["openFile"],
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
                onClick={skipMigration}
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
