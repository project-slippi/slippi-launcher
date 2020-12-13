import { verifyISO } from "@/lib/verifyISO";
import { hasBorder } from "@/styles/hasBorder";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import { withStyles } from "@material-ui/core/styles";
import React from "react";
import { useDropzone } from "react-dropzone";
import styled from "styled-components";
import { QuickStartHeader } from "./QuickStartHeader";

const getColor = (props: any, defaultColor = "#eeeeee") => {
  if (props.isDragAccept) {
    return "#00e676";
  }
  if (props.isDragActive) {
    return "#2196f3";
  }
  return defaultColor;
};

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  ${(props) =>
    hasBorder({
      width: 25,
      color: getColor(props),
      radius: 25,
      dashOffset: 50,
    })}
  color: white;
  outline: none;
  transition: border 0.24s ease-in-out;
  p {
    text-align: center;
    text-transform: uppercase;
    font-weight: bold;
  }
`;

const ErrorMessage = styled.div`
  color: red;
  font-weight: bold;
  margin-bottom: 20px;
`;

export const IsoSelectionStep: React.FC<{
  isoPath: string | null;
  setIsoPath: (isoPath: string | null) => void;
}> = ({ isoPath, setIsoPath }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<any>(null);
  const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
    if (loading) {
      // Only verify one file at a time
      return;
    }

    setError(null);
    console.log(acceptedFiles);
    if (acceptedFiles.length === 0) {
      setError("No file selected");
      return;
    }

    const filePath = acceptedFiles[0].path;
    try {
      setLoading(true);
      const verifyResult = await verifyISO(filePath);
      if (verifyResult.valid) {
        setIsoPath(filePath);
      } else {
        setError(`${verifyResult.name} is not supported`);
      }
    } catch (err) {
      setError(`Invalid ISO`);
    } finally {
      setLoading(false);
    }
  }, []);

  const {
    open,
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    accept: ".iso",
    onDrop: onDrop,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <QuickStartHeader>Select Melee ISO</QuickStartHeader>
      <Container
        {...getRootProps({ isDragActive, isDragAccept, isDragReject })}
      >
        <input {...getInputProps()} />
        {!loading && error && <ErrorMessage>{error}</ErrorMessage>}
        {!loading && (
          <Button
            variant="contained"
            onClick={open}
            style={{ textTransform: "none" }}
          >
            Select
          </Button>
        )}
        <p>{loading ? "Verifying ISO..." : "Or drag and drop here"}</p>
      </Container>
    </Box>
  );
};
