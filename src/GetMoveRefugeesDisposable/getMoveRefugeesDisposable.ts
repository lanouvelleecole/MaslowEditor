import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs/promises";
import * as fs_sync from "fs";
import { IsRelativePath } from "../IsRelativePath/IsRelativePath";
import { RecalibrateFileImports } from "../RecalibrateFileImports/RecalibrateFileImports";
import { FindImportExtension } from "../FindImportExtension/FindImportExtension";
import { getPathWithForwardSlashes } from "../GetPathWithForwardSlashes/getPathWithForwardSlashes";
import {
  ReplaceImportInFile,
  ReplaceImportInFiles,
} from "../ReplaceAllImportsEverywhere/ReplaceAllImportsEverywhere";
import { GetImportsDetailsFromCode } from "../GetMoveCodeToFileDisposable/GetImportsDetailsFromCode";

/**
 *
 * @returns Le déplaceur de montagnes !
 */
export function getMoveRefugeesDisposable() {
  return vscode.commands.registerCommand(
    "masloweditor972.moveRefugees",
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

      let refugees = importsData.map((importData) => {
        return importData.path;
      });

      let refugeesNames = importsData.map((importData) => {
        return importData.names;
      });

      if (refugees?.length == 0) {
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

      /*vscode.window.showInformationMessage(
        `
How many files in total got found, from those imports ?: ${refugees.length}`,
        
      );*/

      const destFolder = await vscode.window.showInputBox({
        prompt: `Enter the path of the destination folder where you want the import file(s) to be (realtive to ${appRootPath}):`,
        value: getPathWithForwardSlashes(
          path.relative(appRootPath, path.dirname(tabPath))
        ),
      });

      if (!destFolder) {
        vscode.window.showErrorMessage("No destination folder provided.");
        return;
      }

      try {
        for (var i = 0; i < refugees.length; i++) {
          const refugee = refugees[i];
          const refugeeNames = refugeesNames[i];

          // le full path du fichier vers lequel l'import pointe
          // (on ajoute l'extension du fichier tab focused, si path d'import sans extension, ou rien autrement)
          let importOriginPath;

          if (IsRelativePath(refugee)) {
            importOriginPath = await FindImportExtension(
              getPathWithForwardSlashes(tabPathFolder),
              getPathWithForwardSlashes(refugee)
            );
          } else {
            importOriginPath = await FindImportExtension(
              getPathWithForwardSlashes(appRootPath),
              getPathWithForwardSlashes(refugee)
            );
          }

          const basenameNoExt = path.basename(refugee, path.extname(refugee));

          // le fichier d'origine d'un des path d'import n'existe pas, alors c'est finito
          if (!importOriginPath) {
            return;
          }

          const extensionOfOrigin = path.extname(importOriginPath);

          // le full path de manchester, UK
          const importNewPath = path.join(
            appRootPath,
            destFolder,
            basenameNoExt + extensionOfOrigin
          );

          // Create any missing directories in the destination path
          const destDir = path.dirname(importNewPath);

          if (!fs_sync.existsSync(destDir)) {
            fs_sync.mkdirSync(destDir, { recursive: true });
          }

          // déplace l'un des import highlighté (srcPath),
          // vers un endroit (destPath)
          await fs.rename(importOriginPath, importNewPath);

          // recalibre les imports dans le fichier déménagé
          RecalibrateFileImports(importOriginPath, importNewPath);

          // Remplace les imports de ce fichier
          // par le nouvel emplacement relatif a sa position actuelle
          // dans tous les fichiers .js / .ts du dossier ouvert dans vscode
          // (AKA APP ROOT)
          await ReplaceImportInFiles(
            appRootPath,
            refugeeNames,
            importOriginPath,
            importNewPath
          );

          // let's wait bby
          vscode.window.showInformationMessage(
            `Magic is taking place, I believe in you... I want you to dream big !`
          );
        }

        vscode.window.showInformationMessage(
          `
All the files were moved successfully to: ${path.join(appRootPath, destFolder)}.
The refugee paths are: 
${refugees.map((refugee) => path.join(tabPathFolder, refugee))}
How many files in total got moved ?: 
${refugees.length}`
        );
      } catch (e) {
        vscode.window.showErrorMessage(`Error moving files: ${e}`);
      }
    }
  );
}
