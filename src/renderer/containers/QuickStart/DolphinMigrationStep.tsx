/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Box from "@material-ui/core/Box";
import Container from "@material-ui/core/Container";
import FormHelperText from "@material-ui/core/FormHelperText";
import { ipc_migrateDolphin } from "common/ipc";
import path from "path";
import React from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/FormInputs/Button";
import { Checkbox } from "@/components/FormInputs/Checkbox";
import { PathInput } from "@/components/PathInput";
import { useDesktopApp } from "@/lib/hooks/useQuickStart";

import { QuickStartHeader } from "./QuickStartHeader";

export const MigrateDolphinStep: React.FC = () => {
  const [migrateNetplay, setMigrateNetplay] = React.useState(false);
  const [migratePlayback, setMigratePlayback] = React.useState(false);
  const oldDesktopAppPath = useDesktopApp((store) => store.path);
  const setExists = useDesktopApp((store) => store.setExists);
  const oldDesktopDolphin = path.join(oldDesktopAppPath, "dolphin");

  const migrateDolphin = async () => {
    await ipc_migrateDolphin.renderer!.trigger({
      migrateNetplay: migrateNetplay ? netplayPath : null,
      migratePlayback: migrateNetplay ? oldDesktopDolphin : null,
      desktopAppPath: oldDesktopAppPath,
    });
    setExists(false);
  };

  const deleteOldDesktopAppFolder = async () => {
    await ipc_migrateDolphin.renderer!.trigger({
      migrateNetplay: null,
      migratePlayback: null,
      desktopAppPath: oldDesktopAppPath,
    });
    setExists(false);
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

  const onNetplaySubmit = handleSubmit(migrateDolphin);

  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <Container>
        <QuickStartHeader>Migrate Dolphin</QuickStartHeader>
        <div>Would you like to migrate your old Slippi Dolphin settings?</div>

        {!migrateNetplay && (
          <Outer>
            <div
              css={css`
                display: flex;
                flex-direction: column;
                margin-top: 15px;
              `}
            >
              <Checkbox label="Netplay" checked={migrateNetplay} onChange={() => setMigrateNetplay(!migrateNetplay)} />
              <Checkbox
                label="Playback"
                checked={migratePlayback}
                onChange={() => setMigratePlayback(!migratePlayback)}
              />
            </div>
          </Outer>
        )}

        {migrateNetplay && (
          <Outer>
            <div
              css={css`
                display: flex;
                flex-direction: column;
                margin-top: 15px;
              `}
            >
              <Checkbox label="Netplay" checked={migrateNetplay} onChange={() => setMigrateNetplay(!migrateNetplay)} />
            </div>
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
                    margin-top: 20px;
                  `}
                >
                  <Checkbox
                    label="Playback"
                    checked={migratePlayback}
                    onChange={() => setMigratePlayback(!migratePlayback)}
                  />
                </div>

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
                    Migrate Dolphin
                  </Button>
                  <Button
                    color="secondary"
                    onClick={deleteOldDesktopAppFolder}
                    css={css`
                      text-transform: initial;
                      margin-top: 10px;
                    `}
                  >
                    Skip Migration
                  </Button>
                </div>
              </form>
            </div>
          </Outer>
        )}
        {!migrateNetplay && (
          <Outer>
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
              <Button onClick={migrateDolphin} variant="contained" color="primary">
                Migrate Dolphin
              </Button>
              <Button
                color="secondary"
                onClick={deleteOldDesktopAppFolder}
                css={css`
                  text-transform: initial;
                  margin-top: 10px;
                `}
              >
                Skip Migration
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
