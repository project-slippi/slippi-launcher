import styled from "@emotion/styled";
import ReactMarkdown from "react-markdown";

import { ExternalLink as A } from "@/components/ExternalLink";
import { withFont } from "@/styles/withFont";

export const MarkdownContent: React.FC<{
  className?: string;
  content: string;
}> = ({ content, className }) => {
  return (
    <Outer className={className}>
      <ReactMarkdown
        skipHtml={true}
        renderers={{
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
