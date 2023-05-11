import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs/promises";
import * as fs_sync from "fs";
import { IsRelativePath } from "../IsRelativePath/IsRelativePath";
import { RecalibrateFileImports } from "../RecalibrateFileImports/RecalibrateFileImports";
import { FindImportExtension } from "../FindImportExtension/FindImportExtension";
import { getPathWithForwardSlashes } from "../GetPathWithForwardSlashes/getPathWithForwardSlashes";
import {
  readFilesRecursively,
  ReplaceImportInFile,
  ReplaceImportInFiles,
} from "../ReplaceAllImportsEverywhere/ReplaceAllImportsEverywhere";
import { GetImportsDetailsFromCode } from "../GetMoveCodeToFileDisposable/GetImportsDetailsFromCode";
import { Constants } from "../AppConstants/Constants";
import { RemoveExtension } from "../RemoveExtension/RemoveExtension";

/**
 *
 * @returns Le trouveur de fantômes !
 */
export function getFindJohnDoeDisposable() {
  return vscode.commands.registerCommand(
    "masloweditor972.findJohnDoe",
    async function () {
      const editor = vscode.window.activeTextEditor;
      let tabPath: string,
        tabPathFolder: string,
        tabPathExtension: string | null = null;

      if (!editor) {
        vscode.window.showErrorMessage("No active text editor found.");
        return;
      } else {
        tabPath = editor.document.uri.fsPath;
        tabPathFolder = path.dirname(tabPath);
        tabPathExtension = path.extname(tabPath);
      }

      const workspaceFolders = vscode.workspace.workspaceFolders;
      // path du root du dossier VS Code
      if (!workspaceFolders) return;

      const appRootPath = workspaceFolders[0].uri.fsPath;

      const selectedText = editor.document.getText(editor.selection);

      const importsData = GetImportsDetailsFromCode(selectedText);

      if (importsData?.length == 0) {
        vscode.window.showErrorMessage(
          "No imports were found in the highlighted text of the focused tab. Highlight some file imports and try this command again."
        );
        return;
      }

      if (!appRootPath) {
        vscode.window.showErrorMessage(
          "No workspace folder opened in VS Code. Open a folder and try this command again."
        );
        return;
      }

      vscode.window.showInformationMessage(
        `Magic is taking place.... I believe in you baby !`
      );

      // pour chaque ligne d'import...
      await importsData.map(async (importLine) => {
        // le path de la ligne d'import highlightée
        // (relatif ou absolu)
        const importPath = importLine.path;
        const importPathWithExt = await FindImportExtension(
          getPathWithForwardSlashes(tabPathFolder),
          getPathWithForwardSlashes(importPath)
        );
        // si cette ligne est relative...
        if (IsRelativePath(importPath)) {
          // si il n'existe pas de fichier .js/.ts a cet endroit...
          if (!importPathWithExt || !fs_sync.existsSync(importPathWithExt)) {
            // cherche tous les fichiers dans root...
            const appFiles = await readFilesRecursively(
              appRootPath,
              Constants.fileExtensions,
              Constants.ignoreList
            );

            // le nom du fichier de l'import
            const importPathFileName = path.basename(
              RemoveExtension(importPath)
            );

            // la liste du ou des fichiers de l'appli, qui ont le meme nom
            // que le nom du fichier d'import disparu
            const files_with_same_name = appFiles.filter((file) => {
              const fileName = path.basename(RemoveExtension(file));

              return fileName == importPathFileName;
            });

            // si un fichier a le même nom que le nom du fichier d'import...
            if (files_with_same_name?.length > 0) {
              // le path de ce fichier
              // shud b
              // "../../../src/AllPrompts/GetGeneratePrompts/askWhatUserWants.js";
              const johnDoePath = files_with_same_name[0];
              const ext = path.extname(johnDoePath);

              let importPathWithCousinExt: string = path.join(
                path.dirname(importPath),
                path.basename(importPath, ext)
              );

              // Remplace cet import dans tabPath
              ReplaceImportInFile(
                tabPath,
                importLine.names,
                importPathWithExt ?? importPathWithCousinExt,
                johnDoePath
              );
            }
          }
        }
      });

      vscode.window.showInformationMessage(`Mission accomplished !`);
    }
  );
}
