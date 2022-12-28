import path from "path";

// Taken from: https://stackoverflow.com/questions/37521893/determine-if-a-path-is-subdirectory-of-another-in-node-js
const isSubdirectory = (parent: string, dir: string): boolean => {
  const relative = path.relative(parent, dir);
  const isSubdir = Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
  return isSubdir;
};

export default isSubdirectory;
