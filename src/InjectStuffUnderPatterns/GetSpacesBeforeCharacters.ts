function GetSpacesBeforeCharacters(fileContents: string, chars: string) {
  const index = fileContents.indexOf(chars);
  if (index === -1) {
    return null;
  }

  let spaces = 0;
  for (let i = index - 1; i >= 0; i--) {
    if (fileContents[i] === " ") {
      spaces++;
    } else {
      break;
    }
  }

  return spaces;
}
export { GetSpacesBeforeCharacters };
