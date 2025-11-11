import { css } from "@emotion/react";
import Paper from "@mui/material/Paper";
import { alpha } from "@mui/material/styles";
import faqMarkdown from "raw-loader!@/../../FAQ.md";
import React from "react";

import { MarkdownContent } from "@/components/markdown_content/markdown_content";

import { SupportBox } from "./support_box";

export const HelpPage = React.memo(() => {
  return (
    <div
      css={css`
        padding-bottom: 80px;
      `}
    >
      <div
        css={css`
          padding-top: 10px;
          padding-bottom: 20px;
        `}
      >
        <SupportBox />
      </div>
      <h1>FAQ</h1>
      <Paper sx={{ backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.85) }}>
        <MarkdownContent
          content={faqMarkdown}
          css={css`
            border-radius: 10px;
            padding-top: 10px;
            padding-bottom: 50px;
            padding-left: 20px;
            padding-right: 20px;

            * {
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
          `}
        />
      </Paper>
    </div>
  );
});
