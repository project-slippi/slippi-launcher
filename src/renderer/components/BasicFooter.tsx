import styled from "@emotion/styled";
import { colors } from "common/colors";

export const BasicFooter = styled.div`
  display: flex;
  padding: 0 20px;
  height: 50px;
  whitespace: nowrap;
  align-items: center;
  background-color: black;
  font-size: 14px;
  color: ${colors.purpleLight};

  svg {
    width: 20px;
    height: auto;
  }
`;
