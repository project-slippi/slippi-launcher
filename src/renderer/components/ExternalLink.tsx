/***
 * This component automatically attaches target="_blank" and rel="noopener noreferrer" to links
 */

import React from "react";

export const ExternalLink = React.forwardRef<HTMLAnchorElement, React.HTMLProps<HTMLAnchorElement>>(
  ({ href, children, ...rest }, ref) => {
    return (
      <a target="_blank" rel="noopener noreferrer" title={href} href={href} ref={ref} {...rest}>
        {children}
      </a>
    );
  },
);
