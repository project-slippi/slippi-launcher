/***
 * This component automatically attaches target="_blank" and rel="noopener noreferrer" to links
 */

import React from "react";

export const ExternalLink: React.FC<React.HTMLProps<HTMLAnchorElement>> = (props) => {
  return (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {props.children}
    </a>
  );
};
