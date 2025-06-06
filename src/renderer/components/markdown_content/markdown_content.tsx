import styled from "@emotion/styled";
import ReactMarkdown from "react-markdown";

import { ExternalLink as A } from "@/components/external_link";
import { withFont } from "@/styles/with_font";

import { CodeBlock } from "./code_block";

export const MarkdownContent = ({ content, className }: { className?: string; content: string }) => {
  return (
    <Outer className={className}>
      <ReactMarkdown
        skipHtml={true}
        renderers={{
          code: ({ value }: { value: string }) => <CodeBlock content={value} />,
          link: ({ href, children }) => (
            <A href={href} title={href}>
              {children}
            </A>
          ),
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
