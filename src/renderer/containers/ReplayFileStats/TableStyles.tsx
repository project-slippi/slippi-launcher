import Paper from "@material-ui/core/Paper";
import React from "react";
import styled, { css } from "styled-components";

export const Table: React.FC = (props) => {
  return (
    <Paper component="table" style={{ borderCollapse: "collapse" }}>
      {props.children}
    </Paper>
  );
};

export const TableHeaderCell = styled.td`
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-style: none solid;
  background-color: rgba(255, 255, 255, 0.2);
  height: 40px;
  text-align: left;
  padding-left: 12px;
  font-size: 18px;
`;

export const TableSubHeaderCell = styled.td`
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-style: none solid;
  background-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  height: 25px;
  font-size: 18px;
  padding: 4px;
`;

export const TableCell = styled.td<{
  highlight?: boolean;
}>`
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-style: none solid;
  color: rgba(255, 255, 255, 0.8);
  padding: 4px 12px;
  font-size: 12px;
  ${(props) =>
    props.highlight &&
    css`
      font-weight: bold;
      color: #ffe21f;
    `};
`;

export const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

interface GrayableImageProps {
  gray?: boolean;
}
export const GrayableImage = styled.img`
  ${(props: GrayableImageProps) =>
    props.gray &&
    css`
      opacity: 0.4;
    `}
`;
