import { css } from "@emotion/react";

export const rubikFont = ["Rubik", "Helvetica", "Arial", "sans-serif"].join(", ");
export const mavenProFont = ["Maven Pro", "Helvetica", "Arial", "sans-serif"].join(", ");

export const withRubikFont = css`
  font-family: ${rubikFont};
`;

export const withMavenProFont = css`
  font-family: ${mavenProFont};
`;
