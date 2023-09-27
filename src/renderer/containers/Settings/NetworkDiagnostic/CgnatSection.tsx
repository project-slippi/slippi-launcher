import { Presence } from "@common/types";
import styled from "@emotion/styled";
import LoadingButton from "@mui/lab/LoadingButton";
import Typography from "@mui/material/Typography";

const DialogBody = styled.div`
  margin-bottom: 1em;
`;

type CgnatSectionProps = {
  address: string;
  cgnat: Presence;
  description: string;
  title: string;
};
export const CgnatSection = ({ address, cgnat, description, title }: CgnatSectionProps) => {
  if (cgnat === Presence.FAILED && !address) {
    return <></>;
  }
  return (
    <>
      <Typography variant="subtitle2">{title}</Typography>
      {cgnat === Presence.UNKNOWN ? <LoadingButton loading={true} /> : <DialogBody>{description}</DialogBody>}
    </>
  );
};
