/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import faqMarkdown from "raw-loader!../../../../FAQ.md";
import React from "react";

import { MarkdownContent } from "@/components/MarkdownContent";

export const HelpPage: React.FC = () => {
  return (
    <div>
      <h1>Help</h1>
      <MarkdownContent
        content={faqMarkdown}
        css={css`
          max-width: 800px;
          border-radius: 10px;
          background-color: rgba(0, 0, 0, 0.7);
          padding: 10px 20px;
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
    </div>
  );
};
