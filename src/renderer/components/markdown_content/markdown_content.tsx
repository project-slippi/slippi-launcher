import styled from "@emotion/styled";
import ReactMarkdown from "react-markdown";

import { ExternalLink as A } from "@/components/external_link";
import { withFont } from "@/styles/with_font";

import { CodeBlock } from "./code_block";

// Custom component for rendering code blocks
const MarkdownCode = ({ children }: { children?: React.ReactNode }) => {
  // For code blocks, children is the text content
  const value = String(children).replace(/\n$/, "");
  return <CodeBlock content={value} />;
};

// Custom component for rendering links
const MarkdownLink = ({ href, children }: { href?: string; children?: React.ReactNode }) => (
  <A href={href ?? ""} title={href ?? ""}>
    {children}
  </A>
);

export const MarkdownContent = ({ content, className }: { className?: string; content: string }) => {
  return (
    <Outer className={className}>
      <ReactMarkdown
        skipHtml={true}
        components={{
          code: MarkdownCode,
          a: MarkdownLink,
        }}
      >
        {content}
      </ReactMarkdown>
    </Outer>
  );
};

const Outer = styled.div`
  * {
    user-select: text;
  }
  font-family: ${withFont("Rubik")};

  h1,
  h2,
  h3 {
    font-family: ${withFont("Maven Pro")};
  }

  img {
    display: list-item;
    max-width: 100%;
  }

  li {
    margin-bottom: 5px;

    ul {
      margin-top: 5px;
    }
  }

  a {
    text-decoration: underline;
    word-break: break-word;
  }
`;
