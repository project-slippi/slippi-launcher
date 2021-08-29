/***
 * This component automatically attaches target="_blank" and rel="noopener noreferrer" to links
 */

import React from "react";

export const ExternalLink: React.FC<React.HTMLProps<HTMLAnchorElement>> = ({ href, children, ...rest }) => {
  return (
    <a target="_blank" rel="noopener noreferrer" title={href} href={href} {...rest}>
      {children}
    </a>
  );
};
