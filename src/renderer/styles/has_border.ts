import { css } from "@emotion/react";

export const hasBorder = ({
  width = 1,
  radius = 0,
  color = "black",
  linecap = "square" as "square" | "round" | "butt",
  dashArray = [10, 50],
  dashOffset = 0,
}) => {
  const colorString = color.replace("#", "%23");
  const dashArrayString = dashArray.join("%2c ");
  return css`
    background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='${radius}' ry='${radius}' stroke='${colorString}' stroke-width='${width}' stroke-dasharray='${dashArrayString}' stroke-dashoffset='${dashOffset}' stroke-linecap='${linecap}'/%3e%3c/svg%3e");
    border-radius: ${radius}px;
  `;
};
