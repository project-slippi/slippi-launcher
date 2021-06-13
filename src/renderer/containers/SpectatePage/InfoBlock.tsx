/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Paper from "@material-ui/core/Paper";
import React from "react";

export interface InfoBlockProps {
  title: string;
  className?: string;
}

export const InfoBlock: React.FC<InfoBlockProps> = ({ title, children, className }) => {
  return (
    <Block className={className}>
      <Header title={title} />
      <div>{children}</div>
    </Block>
  );
};

const Block = styled(Paper)`
  padding: 20px;
`;

const Header: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div
      css={css`
        display: flex;
        align-items: center;
        h3 {
          color: #39d05d;
          margin: 0;
          margin-bottom: 20px;
        }
      `}
    >
      <h3>{title}</h3>
    </div>
  );
};
