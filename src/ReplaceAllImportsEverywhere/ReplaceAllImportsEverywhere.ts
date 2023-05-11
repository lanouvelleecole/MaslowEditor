import * as fs from "fs";
import * as path from "path";
import { getPathWithForwardSlashes } from "../GetPathWithForwardSlashes/getPathWithForwardSlashes";
import { RemoveExtension } from "../RemoveExtension/RemoveExtension";

import * as util from "util";
import { AddDotAndSlashToPath } from "../RecalibrateFileImports/RecalibrateFileImports";
import { Constants } from "../AppConstants/Constants";

/**
 * Replaces imports in all JavaScript/TypeScript files in a folder.
 *
 * @param folderPath The folder path containing the files to modify.
 * @param importName The name of the import to replace (if null, all imports pointing to oldPath are replaced).
 * @param oldPath The old import path to replace.
 * @param newPath The new import path to use.
 */
async function ReplaceImportInFiles(
  folderPath: string,
  importNames: string[] | null,
  oldPath: string,
  newPath: string
) {
  const files = await readFilesRecursively(
    folderPath,
    Constants.fileExtensions,
    Constants.ignoreList
  );

  for (const file of files) {
    ReplaceImportInFile(file, importNames, oldPath, newPath);
  }
}

/**
 *
 * @param filePath, le path du fichier contenant les imports à remplacer.
 * @param importName, (optionnel) le nom de l'import a remplacer.
 * Si null, alors touts les imports pointant vers oldPath sont remplacés.
 * Si pas null, alors seul l'import ayant importName comme nom, est remplacé.
 * @param oldPath, l'ancien path d'import qu'on veut changer.
 * @param newPath, le nouveau path d'import souhaité.
 *
 * Remplace l'import, dans filePath, vers newPath,
 * si il pointe vers oldPath eet (optionnellement) si le nom de l'import est importName.
 */
function ReplaceImportInFile(
  filePath: string,
  importNames: string[] | null,
  oldPath: string,
  newPath: string
) {
  // le code source de filePath
  const source = fs.readFileSync(filePath, "utf-8");

  // le path d'import a remplacer (version relative)
  const oldPathRelative = AddDotAndSlashToPath(
    getPathWithForwardSlashes(
      RemoveExtension(path.relative(path.dirname(filePath), oldPath))
    )
  );

  let importRegex: RegExp;
  let fromRegex: RegExp;

  // si un ou plusieurs nom d'import est fourni
  if (importNames) {
    // cherche la ligne d'import ayant comme nom importName et ayant comme path oldPath (relative)
    importRegex = new RegExp(
      `import\\s*(\\{\\s*(${importNames.join(
        "|"
      )})\\s*\\})?\\s*from\\s*['"]${escapeRegExp(
        oldPathRelative
      )}(\\.ts|\\.js)?['"]\\s*;`
    );
  }
  // si aucun nom d'import est fourni
  else {
    // cherche la ligne d'import ayant comme path oldPath (relative)
    throw new Error(`You forgot to add some import names...`);
  }

  // permet de trouver la ligne de variable souhaitée
  const importMatch = source.match(importRegex);

  // si la ligne de variable/constante a été trouvée...
  if (importMatch) {
    const importStatement = importMatch[0];

    const newRelativePath = AddDotAndSlashToPath(
      RemoveExtension(
        getPathWithForwardSlashes(
          path.relative(path.dirname(filePath), newPath)
        )
      )
    );

    const updatedImportStatement = importStatement.replace(
      oldPathRelative,
      newRelativePath
    );

    const updatedSource = source.replace(
      importStatement,
      updatedImportStatement
    );

    fs.writeFileSync(filePath, updatedSource);
  }

  return;
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export async function readFilesRecursively(
  folderPath: string,
  fileExtensions: string[],
  ignoredPaths: string[],
  result: string[] = []
): Promise<string[]> {
  const files = await fs.promises.readdir(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const fileStat = await fs.promises.stat(filePath);

    if (fileStat.isDirectory()) {
      if (!ignoredPaths.some((ignoredPath) => filePath.includes(ignoredPath))) {
        await readFilesRecursively(
          filePath,
          fileExtensions,
          ignoredPaths,
          result
        );
      }
    } else if (fileExtensions.includes(path.extname(filePath))) {
      result.push(filePath);
    }
  }

  return result;
}

export { ReplaceImportInFile, ReplaceImportInFiles };
