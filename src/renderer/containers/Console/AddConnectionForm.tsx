/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import Button from "@material-ui/core/Button";
import Collapse from "@material-ui/core/Collapse";
import FormHelperText from "@material-ui/core/FormHelperText";
import TextField from "@material-ui/core/TextField";
import React from "react";
import { useForm } from "react-hook-form";

import { Toggle } from "@/components/FormInputs/Toggle";
import { PathInput } from "@/components/PathInput";

type FormValues = {
  ipAddress: string;
  port: number;
  folderPath: string;
  isRealTimeMode: boolean;
  obsIP?: string;
  obsSourceName?: string;
  obsPassword?: string;
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
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues });
  const ipAddress = watch("ipAddress");
  const folderPath = watch("folderPath");
  const isRealTimeMode = watch("isRealTimeMode");
  const obsIP = watch("obsIP");
  const obsPassword = watch("obsPassword");
  const obsSourceName = watch("obsSourceName");

  const onFormSubmit = handleSubmit(onSubmit);

  return (
    <div>
      <form className="form" onSubmit={onFormSubmit}>
        <section>
          <TextField
            label="IP Address"
            value={ipAddress}
            onChange={(e) => setValue("ipAddress", e.target.value)}
            required={true}
          />
        </section>

        <section>
          <label>Target Folder</label>
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
            label="Real-time mode"
          />
        </section>

        <div>
          <Button size="small" onClick={() => setShowAdvanced(!showAdvanced)} color="secondary">
            {showAdvanced ? "Hide" : "Show"} advanced options
          </Button>
        </div>
        <Collapse in={showAdvanced}>
          <div
            css={css`
              display: grid;
              grid-gap: 10px;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              margin-bottom: 10px;
            `}
          >
            <TextField
              label="OBS Websocket IP:Port"
              value={obsIP ?? ""}
              required={showAdvanced}
              onChange={(e) => setValue("obsIP", e.target.value)}
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
            required={showAdvanced}
            onChange={(e) => setValue("obsSourceName", e.target.value)}
          />
        </Collapse>

        <Button type="submit" variant="contained" color="primary">
          Submit
        </Button>
      </form>
    </div>
  );
};
