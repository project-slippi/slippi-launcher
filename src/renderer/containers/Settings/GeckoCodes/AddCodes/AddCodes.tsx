import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import React from "react";

export const AddCodes = ({ onSubmit }: { onSubmit: (value: string) => void }) => {
  const [value, onChange] = React.useState("");
  const handleSubmit = () => {
    onSubmit(value);
  };

  return (
    <Box textAlign="center">
      <TextField
        type="textarea"
        label="Paste Gecko Codes"
        variant="filled"
        margin="normal"
        rows="25"
        InputProps={{ style: { fontFamily: '"Space Mono", monospace', fontSize: "12px" } }}
        multiline={true}
        fullWidth={true}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      <Button type="submit" fullWidth={true} variant="contained" color="secondary" onClick={handleSubmit}>
        Add
      </Button>
    </Box>
  );
};
