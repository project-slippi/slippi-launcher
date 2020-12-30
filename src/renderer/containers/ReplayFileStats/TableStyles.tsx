import styled, { css } from "styled-components";
import { colors } from "../../../common/colors";

export const Table = styled.table`
  width: 90%;
  border-collapse: collapse;
  margin-bottom: 50px;
  box-shadow: 0px 0px 12px rgba(0, 0, 0, 0.7);
  font-size: 14px;
`;

export const TableHeaderCell = styled.td`
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-style: none solid;
  background-color: rgba(255, 255, 255, 0.2);
  height: 50px;
  text-align: left;
  padding-left: 12px;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0px 0px 15px rgba(255, 255, 255, 1);
`;

export const TableSubHeaderCell = styled.td`
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-style: none solid;
  background-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  height: 40px;
  font-size: 18px;
  padding: 4px;
`;

interface TableCellProps {
  highlight?: boolean;
}

export const TableCell = styled.td`
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-style: none solid;
  color: rgba(255, 255, 255, 0.8);
  padding: 4px 12px;
  font-size: 12px;
  ${(props: TableCellProps) =>
    props.highlight &&
    css`
      color: khaki;
      text-shadow: 0px 0px 3px khaki;
    `};
`;

export const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: ${colors.foreground};
  }
`;
