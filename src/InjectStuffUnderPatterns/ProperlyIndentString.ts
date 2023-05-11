function ProperlyIndentString(stringToIndent: string, qtySpaces: number) {
  const indentation = " ".repeat(qtySpaces);
  return stringToIndent.replace(/\n/g, `\n${indentation}`);
}

function ProperlyIndentFirstLine(stringToIndent: string, qtySpaces: number) {
  const indentation = " ".repeat(qtySpaces);
  return stringToIndent.replace(/\n/, `\n${indentation}`);
}

export { ProperlyIndentString, ProperlyIndentFirstLine };
