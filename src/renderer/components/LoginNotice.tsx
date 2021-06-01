import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import PersonOutlineIcon from "@material-ui/icons/PersonOutline";
import React from "react";

import { useLoginModal } from "@/lib/hooks/useLoginModal";

export const LoginNotice: React.FC = () => {
  const openModal = useLoginModal((store) => store.openModal);
  return (
    <Outer>
      <div>
        <PersonOutlineIcon style={{ fontSize: 100 }} />
      </div>
      <Typography variant="h6">User is not logged in</Typography>
      <Button type="button" color="primary" variant="contained" style={{ textTransform: "none" }} onClick={openModal}>
        Log in
      </Button>
    </Outer>
  );
};

const Outer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  align-items: center;
  justify-content: center;
`;
