export function removeDuplicatesFromArray(
  arr: Iterable<unknown> | null | undefined
): any[] {
  return Array.from(new Set(arr));
}
