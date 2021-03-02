import Typography from "@material-ui/core/Typography";
import React from "react";
import styled from "styled-components";

import { AdInfo } from "./types";

const Outer = styled.div<{
  backgroundColor: string;
}>`
  height: 100%;
  width: 100%;
  background-color: ${(p) => p.backgroundColor};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

export interface AdvertProps {
  info: AdInfo;
}

export const Advert: React.FC<AdvertProps> = ({ info }) => {
  return (
    <Outer backgroundColor={info.backgroundColor}>
      <Heading>{info.title}</Heading>
      <div style={{ display: "flex", alignItems: "center", marginTop: 5 }}>
        <div style={{ marginRight: 20 }}>{info.icon}</div>
        <Typography variant="h6">{info.subtitle}</Typography>
      </div>
    </Outer>
  );
};

const Heading = styled.div`
  font-size: 26px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
`;
