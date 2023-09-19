import { css } from "@emotion/react";
import styled from "@emotion/styled";
import Paper from "@mui/material/Paper";
import { alpha } from "@mui/material/styles";
import faqMarkdown from "raw-loader!../../../../FAQ.md";
import React from "react";

import { MarkdownContent } from "@/components/MarkdownContent";

import { Diagnostic } from "./Diagnostic";
import { SupportBox } from "./SupportBox";

const PaperInnerCss = css`
  border-radius: 10px;
  padding: 10px 20px;

  code,
  li,
  p {
    color: #bbb;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: white;
  }

  h2:not(:first-of-type) {
    border-top: solid 1px rgba(255, 255, 255, 0.15);
    margin-top: 50px;
    padding-top: 50px;
  }
`;

export const HelpPage = React.memo(() => {
  return (
    <Outer>
      <div
        css={css`
          margin-top: 4px;
          margin-bottom: 32px;
        `}
      >
        <SupportBox />
      </div>
      <Paper sx={{ backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.85) }}>
        <div css={PaperInnerCss}>
          <Diagnostic />
        </div>
      </Paper>
      <h1>FAQ</h1>
      <Paper sx={{ backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.85) }}>
        <MarkdownContent content={faqMarkdown} css={PaperInnerCss} />
      </Paper>
    </Outer>
  );
});

const Outer = styled.div`
  max-width: 800px;
`;
