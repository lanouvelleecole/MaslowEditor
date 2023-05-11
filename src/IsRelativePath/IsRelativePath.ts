export function IsRelativePath(p: string) {
  return p && p.length > 0 && p.trim().startsWith(".");
}
