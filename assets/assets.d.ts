/* eslint-disable import/no-default-export */
type Styles = Record<string, string>;

declare module "*.svg" {
  export const ReactComponent: React.FC<React.SVGAttributes<SVGElement>>;
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.scss" {
  const content: Styles;
  export default content;
}

declare module "*.sass" {
  const content: Styles;
  export default content;
}

declare module "*.css" {
  const content: Styles;
  export default content;
}
