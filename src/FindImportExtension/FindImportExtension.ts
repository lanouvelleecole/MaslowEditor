import * as path from "path";
import * as fs from "fs";
import { Constants } from "../AppConstants/Constants";

async function FindImportExtension(
  rootPath: string,
  importPath: string
): Promise<string | null> {
  // les extensions possibles pour nos fichiers

  // si il existe déja une extension pour le path de cet import
  // alors c'est farniente
  if (ThisPathIsJSOrTS(importPath)) {
    return path.join(rootPath, importPath);
  } else {
    /**
     * si le path d'import est sans extension,
     * alors c'est atelier chirurgie
     */
    for (const extension of Constants.fileExtensions) {
      // essaie de créer un fichier avec chaque extension, pour tester qui est real
      const filePath = path.join(rootPath, importPath + extension);

      // si extenion n est la bonne
      // alors retourne ce path absolu
      if (await fileExists(filePath)) {
        return filePath;
      }
    }

    // si ca pue, retourne du vide
    return null;
  }
}

export function ThisPathIsJSOrTS(importPath: string) {
  return (
    importPath.trim().endsWith(".js") ||
    importPath.trim().endsWith(".ts") ||
    importPath.trim().endsWith(".jsx") ||
    importPath.trim().endsWith(".tsx")
  );
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export { FindImportExtension };
