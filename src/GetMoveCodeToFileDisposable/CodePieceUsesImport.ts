export function CodePieceUsesImport(codePiece: string, importName: string) {
  const regex = new RegExp(`(^|[({[;,\\s])${importName}([\\s\\]})\\();,.]|$)`);
  return regex.test(codePiece);
}
