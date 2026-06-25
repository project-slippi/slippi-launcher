import { css } from "@emotion/react";
import faqMarkdown from "raw-loader!@/../../FAQ.md";
import React from "react";

import { MarkdownContent } from "@/components/markdown_content/markdown_content";

import { HelpPageMessages as Messages } from "./help_page.messages";
import { SupportBox } from "./support_box/support_box";

export const HelpPage = React.memo(() => {
  return (
    <div>
      <div
        css={css`
          padding-top: 10px;
          padding-bottom: 20px;
        `}
      >
        <SupportBox />
      </div>
      <h1>{Messages.faq()}</h1>
      <div
        css={css`
          padding-bottom: 40px;
        `}
      >
        <MarkdownContent
          content={faqMarkdown}
          css={css`
            * {
              color: #bbb;
            }

            h1,
            h2,
            h3,
            h4,
            h5,
            h6 {
              color: var(--off-white);
            }

            h2:not(:first-of-type) {
              border-top: solid 1px rgba(255, 255, 255, 0.15);
              margin-top: 50px;
              padding-top: 50px;
            }
          `}
        />
      </div>
    </div>
  );
});
