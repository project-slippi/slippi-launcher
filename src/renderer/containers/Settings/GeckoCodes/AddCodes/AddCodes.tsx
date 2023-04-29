import { css } from "@emotion/react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import React from "react";

export const AddCodes = ({ onSubmit }: { onSubmit: (value: string) => void }) => {
  const [value, onChange] = React.useState("");
  const handleSubmit = () => {
    onSubmit(value);
  };

  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
      `}
    >
      <div
        css={css`
          flex: 1;
        `}
      >
        <TextField
          type="textarea"
          label="Paste Gecko Codes"
          variant="filled"
          margin="normal"
          rows="20"
          sx={{ height: "100%" }}
          InputProps={{ style: { fontFamily: '"Space Mono", monospace', fontSize: "12px" } }}
          multiline={true}
          fullWidth={true}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      </div>
      <Button type="submit" fullWidth={true} variant="contained" color="secondary" onClick={handleSubmit}>
        Add
      </Button>
    </div>
  );
};
