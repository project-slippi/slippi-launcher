import styled from "@emotion/styled";
import React from "react";

export const Broadcast: React.FC = () => {
  return (
    <Outer>
      <h1>Broadcast</h1>
    </Outer>
  );
};

const Outer = styled.div`
  height: 100%;
  width: 100%;
  margin: 0 20px;
`;
