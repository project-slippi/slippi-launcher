import { css } from "@emotion/react";
import styled from "@emotion/styled";
import Paper from "@mui/material/Paper";
import React from "react";

export interface InfoBlockProps {
  title: React.ReactNode | string;
  className?: string;
}

export const InfoBlock: React.FC<InfoBlockProps> = ({ title, children, className }) => {
  return (
    <Block className={className}>
      <Header>{title}</Header>
      <div>{children}</div>
    </Block>
  );
};

const Block = styled(Paper)`
  padding: 20px;
`;

const Header: React.FC = ({ children }) => {
  return (
    <div
      css={css`
        display: flex;
        align-items: center;
        h3 {
          flex: 1;
          color: #39d05d;
          margin: 0;
          margin-bottom: 20px;
        }
      `}
    >
      <h3>{children}</h3>
    </div>
  );
};
