function RemoveExtension(path: string): string {
  // Check if the path has an extension
  const lastDotIndex = path.lastIndexOf(".");
  const hasExtension =
    lastDotIndex !== -1 && lastDotIndex > path.lastIndexOf("/");

  // If the path has an extension, remove it
  if (hasExtension) {
    return path.slice(0, lastDotIndex);
  } else {
    return path;
  }
}

export { RemoveExtension };
