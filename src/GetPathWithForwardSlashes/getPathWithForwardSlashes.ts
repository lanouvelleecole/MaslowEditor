function getPathWithForwardSlashes(path: string) {
  return path.replace(/\\/g, "/");
}

export { getPathWithForwardSlashes };
