/** @jsx jsx */
import { ipc_copyDolphinConfig } from "@dolphin/ipc";
import { DolphinLaunchType } from "@dolphin/types";
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Box from "@material-ui/core/Box";
import Container from "@material-ui/core/Container";
import FormHelperText from "@material-ui/core/FormHelperText";
import * as fs from "fs-extra";
import path from "path";
import React from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/FormInputs/Button";
import { PathInput } from "@/components/PathInput";
import { useDesktopApp } from "@/lib/hooks/useQuickStart";

import { QuickStartHeader } from "./QuickStartHeader";

const MIGRATE_TEXT = "Migrate Dolphin";
const SKIP_TEXT = "Skip Migration";

export const MigrateDolphinStep: React.FC = () => {
  const [netplayMigration, setNetplayMigration] = React.useState(true);
  const oldDesktopAppPath = useDesktopApp((store) => store.path);
  const setExists = useDesktopApp((store) => store.setExists);
  const oldDesktopDolphin = path.join(oldDesktopAppPath, "dolphin");

  const migrateNetplayDolphin = async () => {
    await ipc_copyDolphinConfig.renderer!.trigger({ dolphinType: DolphinLaunchType.NETPLAY, userPath: netplayPath });
    setNetplayMigration(false);
  };

  const deleteOldDesktopAppFolder = async () => {
    await fs.remove(oldDesktopAppPath);
    setExists(false);
  };
  const migratePlaybackDolphin = async () => {
    await ipc_copyDolphinConfig.renderer!.trigger({
      dolphinType: DolphinLaunchType.PLAYBACK,
      userPath: oldDesktopDolphin,
    });
    await deleteOldDesktopAppFolder();
  };

  const defaultValues = { netplayPath: "" };

  const {
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<{ netplayPath: string }>({ defaultValues });
  const netplayPath = watch("netplayPath");

  const onNetplaySubmit = handleSubmit(migrateNetplayDolphin);

  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <Container>
        <QuickStartHeader>Migrate Dolphin</QuickStartHeader>
        {netplayMigration && (
          <Outer>
            <div>Would you like to migrate your old netplay Slippi Dolphin settings?</div>
            <div
              css={css`
                margin-top: 20px;
              `}
            >
              <form className="form" onSubmit={onNetplaySubmit}>
                <Controller
                  name="netplayPath"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <PathInput
                      {...field}
                      value={netplayPath}
                      onSelect={(newPath) => setValue("netplayPath", newPath)}
                      placeholder="No folder set"
                      options={{ properties: ["openDirectory"] }}
                    />
                  )}
                  rules={{ validate: (val) => val.length > 0 || "Must select a path to migrate from" }}
                ></Controller>
                <FormHelperText error={Boolean(errors?.netplayPath)}>{errors?.netplayPath?.message}</FormHelperText>
                <div
                  css={css`
                    display: flex;
                    flex-direction: column;
                    margin-top: 50px;
                    margin-left: auto;
                    margin-right: auto;
                    width: 400px;
                  `}
                >
                  <Button type="submit" variant="contained" color="primary">
                    {MIGRATE_TEXT}
                  </Button>
                  <Button
                    color="secondary"
                    onClick={() => setNetplayMigration(false)}
                    css={css`
                      text-transform: initial;
                      margin-top: 10px;
                    `}
                  >
                    {SKIP_TEXT}
                  </Button>
                </div>
              </form>
            </div>
          </Outer>
        )}
        {!netplayMigration && (
          <Outer>
            <div>
              We found an old installation of the Slippi Desktop App, would you like to migrate your old playback Slippi
              Dolphin settings?
            </div>
            <div
              css={css`
                display: flex;
                flex-direction: column;
                margin-left: auto;
                margin-right: auto;
                margin-top: 50px;
                width: 400px;
              `}
            >
              <Button onClick={migratePlaybackDolphin} variant="contained" color="primary">
                {MIGRATE_TEXT}
              </Button>
              <Button
                color="secondary"
                onClick={deleteOldDesktopAppFolder}
                css={css`
                  text-transform: initial;
                  margin-top: 10px;
                `}
              >
                {SKIP_TEXT}
              </Button>
            </div>
          </Outer>
        )}
      </Container>
    </Box>
  );
};

const Outer = styled.div`
  form section {
    margin-bottom: 15px;
  }
`;
