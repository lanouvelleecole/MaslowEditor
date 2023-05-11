import * as fs from "fs";
import * as path from "path";
import { getPathWithForwardSlashes } from "../GetPathWithForwardSlashes/getPathWithForwardSlashes";
import { RemoveExtension } from "../RemoveExtension/RemoveExtension";
import * as vscode from "vscode";
import { IsRelativePath } from "../IsRelativePath/IsRelativePath";

function RecalibrateFileImports(fromPath: string, toPath: string) {
  // Read the contents of the file at toPath
  const fileContent = fs.readFileSync(toPath, { encoding: "utf-8" });

  // Replace all relative imports in the source code of toPath
  const newFileContent = fileContent.replace(
    /from\s+['"](\..+?)['"]/g,
    (match, relativePath) => {
      // Determine the absolute path of one the imports in toPath
      const absoluteImportPath = path.resolve(
        path.dirname(fromPath),
        relativePath
      );

      // Determine the new relative path of the import
      let newRelativePath = path.relative(
        path.dirname(toPath),
        absoluteImportPath
      );

      // ajoute dot et slash ./ si pas déja la
      newRelativePath = AddDotAndSlashToPath(newRelativePath);

      // Return the updated import statement
      return `from '${getPathWithForwardSlashes(newRelativePath)}'`;
    }
  );

  // Write the updated file content back to the file
  fs.writeFileSync(toPath, newFileContent, { encoding: "utf-8" });
}

export function AddDotAndSlashToPath(filePath: string) {
  if (!IsRelativePath(filePath)) {
    return `./${filePath}`;
  }

  return filePath;
}

export { RecalibrateFileImports };
