/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import faqMarkdown from "raw-loader!../../../../FAQ.md";
import React from "react";

import { MarkdownContent } from "@/components/MarkdownContent";

import { SupportBox } from "./SupportBox";

export const HelpPage: React.FC = () => {
  return (
    <Outer>
      <SupportBox
        css={css`
          margin-top: 10px;
          margin-bottom: 40px;
        `}
      />
      <h1>FAQ</h1>
      <MarkdownContent
        content={faqMarkdown}
        css={css`
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
    </Outer>
  );
};

const Outer = styled.div`
  max-width: 800px;
`;
