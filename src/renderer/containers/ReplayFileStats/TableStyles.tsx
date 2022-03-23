import { colors } from "@common/colors";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import Paper from "@mui/material/Paper";
import { alpha } from "@mui/material/styles";
import React from "react";

export const Table: React.FC = (props) => {
  return (
    <Paper
      component="table"
      style={{
        borderCollapse: "collapse",
        height: "fit-content",
        borderRadius: 4,
        border: "none",
        backgroundColor: alpha(colors.purpleDark, 0.9),
      }}
    >
      {props.children}
    </Paper>
  );
};

export const TableHeaderCell = styled.td`
  border: none;
  background-color: rgba(255, 255, 255, 0.2);
  height: 40px;
  text-align: left;
  padding-left: 12px;
  font-size: 18px;
`;

export const TableSubHeaderCell = styled.td`
  border: none;
  background-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  height: 25px;
  font-size: 14px;
  font-weight: 500;
  padding: 5px 10px;
  &:not(:first-of-type) {
    border-left: solid 2px rgba(255, 255, 255, 0.1);
  }
`;

export const TableCell = styled.td<{
  highlight?: boolean;
}>`
  border: none;
  color: rgba(255, 255, 255, 0.6);
  padding: 10px;
  font-size: 16px;
  ${(props) =>
    props.highlight &&
    css`
      font-weight: 500;
      color: #ffe21f;
    `};
  &:not(:first-of-type) {
    border-left: solid 2px rgba(255, 255, 255, 0.1);
  }
`;

export const TableRow = styled.tr`
  border: none;
  &:nth-of-type(even) {
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
