import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import InputBase from "@material-ui/core/InputBase";
import Paper from "@material-ui/core/Paper";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { OpenDialogOptions, remote } from "electron";
import React from "react";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: "2px",
      display: "flex",
      alignItems: "center",
      width: 400,
      flex: 1,
      marginRight: 10,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    input: {
      marginLeft: theme.spacing(2),
      marginRight: theme.spacing(2),
      flex: 1,
      fontWeight: 300,
      fontSize: 14,
    },
    divider: {
      height: 28,
      margin: 4,
    },
    validation: {
      display: "flex",
      alignItems: "center",
      marginRight: 10,
    },
    invalid: {
      color: theme.palette.error.main,
    },
    valid: {
      color: theme.palette.success.main,
    },
    validationText: {
      marginRight: 5,
      fontWeight: 500,
    },
  }),
);

export interface PathInputProps {
  onSelect: (filePath: string) => void;
  placeholder?: string;
  value?: string;
  options?: OpenDialogOptions;
  endAdornment?: JSX.Element;
  disabled?: boolean;
}

export const PathInput = React.forwardRef<HTMLInputElement, PathInputProps>((props, ref) => {
  const { value, placeholder, endAdornment, onSelect, options, disabled } = props;
  const classes = useStyles();
  const onClick = async () => {
    const result = await remote.dialog.showOpenDialog(options ?? { properties: ["openFile"] });
    const res = result.filePaths;
    if (result.canceled || res.length === 0) {
      return;
    }
    onSelect(res[0]);
  };
  return (
    <Box display="flex">
      <Paper className={classes.root}>
        <InputBase inputRef={ref} disabled={true} className={classes.input} value={value} placeholder={placeholder} />
        {endAdornment}
      </Paper>
      <Button color="secondary" variant="contained" onClick={onClick} disabled={disabled}>
        Select
      </Button>
    </Box>
  );
});
