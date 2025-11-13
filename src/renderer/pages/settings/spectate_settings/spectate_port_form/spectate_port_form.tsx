import { TextField } from "@mui/material";
import Button from "@mui/material/Button";
import * as stylex from "@stylexjs/stylex";
import React from "react";
import { Controller, useForm } from "react-hook-form";

import { SpectatePortFormMessages as Messages } from "./spectate_port_form.messages";

const DEFAULT_PORT = 49809;

const styles = stylex.create({
  container: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    flexWrap: "nowrap",
    maxWidth: "fit-content",
  },
  button: {
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
});

export const SpectatePortForm = React.memo(({ port, onChange }: { port: number; onChange: (port: number) => void }) => {
  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { isDirty },
  } = useForm<{ port: number }>({
    defaultValues: { port: port || DEFAULT_PORT },
  });

  // Reset form when port prop changes (e.g., after successful save)
  React.useEffect(() => {
    reset({ port: port || DEFAULT_PORT });
  }, [port, reset]);

  const currentPort = watch("port");
  const isNotDefaultPort = currentPort !== DEFAULT_PORT;

  const onResetToDefault = () => {
    onChange(DEFAULT_PORT);
  };

  const onFormSubmit = handleSubmit((data) => {
    onChange(data.port);
  });

  return (
    <div {...stylex.props(styles.container)}>
      <Controller
        name="port"
        control={control}
        rules={{
          required: Messages.portIsRequired(),
          validate: (value) => {
            const num = Number(value);
            if (isNaN(num) || num <= 0 || num > 65535) {
              return Messages.portMustBeNumber();
            }
            return true;
          },
        }}
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            hiddenLabel={true}
            size="small"
            error={Boolean(error)}
            helperText={error?.message}
            inputProps={{ maxLength: 5 }}
            type="number"
            sx={{ width: "120px", flexShrink: 0 }}
          />
        )}
      />
      <Button
        variant="contained"
        color="secondary"
        onClick={onFormSubmit}
        disabled={!isDirty}
        {...stylex.props(styles.button)}
      >
        {Messages.save()}
      </Button>
      <Button
        color="secondary"
        variant="outlined"
        onClick={onResetToDefault}
        disabled={!isNotDefaultPort}
        {...stylex.props(styles.button)}
      >
        {Messages.resetToDefault()}
      </Button>
    </div>
  );
});
