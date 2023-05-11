import * as fs from "fs";
import { CodePieceUsesImport } from "./CodePieceUsesImport";
import * as vscode from "vscode";

export function GetImportsDetailsFromCode(codePiece: string) {
  try {
    const importLines = codePiece.match(/import[\s\S]*?;\s*/g) || [];
    const basket = [];

    for (const importLine of importLines) {
      // Check for default import syntax: `import <import name> from <import path>`
      const defaultImportMatch = importLine.match(
        /^import\s+([\w\d_$]+)\s+from\s+['"](.+)['"];/
      );
      if (defaultImportMatch) {
        const importName = defaultImportMatch[1];
        const importPath = defaultImportMatch[2];

        basket.push({ names: [importName], path: importPath });
      }

      // Check for named import syntax: `import { <import name> } from <import path>`
      const namedImportMatch = importLine.match(
        /^import\s+{([\s\S]+?)}\s+from\s+['"](.+)['"];/
      );
      if (namedImportMatch) {
        const importNames = namedImportMatch[1]
          .split(",")
          .map((name: string) => name.trim())
          .filter((name) => name?.length > 0);

        const importPath = namedImportMatch[2];

        basket.push({ names: importNames, path: importPath });
      }
    }

    return basket;
  } catch (error) {
    console.error(error);
    return [];
  }
}
