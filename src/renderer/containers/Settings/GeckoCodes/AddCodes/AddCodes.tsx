import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

export const AddCodes = ({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
}) => {
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
      <Button type="submit" fullWidth={true} variant="contained" color="secondary" onClick={onSubmit}>
        Add
      </Button>
    </Box>
  );
};
