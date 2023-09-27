import { type PortMapping, Presence } from "@common/types";
import styled from "@emotion/styled";
import LoadingButton from "@mui/lab/LoadingButton";
import Typography from "@mui/material/Typography";

const DialogBody = styled.div`
  margin-bottom: 1em;
`;

type PortMappingSectionProps = {
  description: string;
  portMapping: PortMapping;
  title: string;
};
export const PortMappingSection = ({ description, portMapping, title }: PortMappingSectionProps) => {
  const isLoading = portMapping.upnp === Presence.UNKNOWN || portMapping.natpmp === Presence.UNKNOWN;
  return (
    <>
      <Typography variant="subtitle2">{title}</Typography>
      {isLoading ? <LoadingButton loading={true} /> : <DialogBody>{description}</DialogBody>}
    </>
  );
};
